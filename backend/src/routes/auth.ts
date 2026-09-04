import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OtpPurpose, UserRole } from '@prisma/client';
import prisma from '../lib/prisma';
import resend from '../lib/resend';
import { JwtPayload } from '../types/express';
import { sendOtpEmail } from '../lib/email';

const router = Router();

// --- 1. Signup (Email, Password, Name, Phone, Terms Consent) ---
router.post('/signup', async (req: Request, res: Response): Promise<void> => {
  const { firstName, lastName, email, password, phone, acceptTerms } = req.body;

  if (!email || !password || !firstName || !lastName) {
    res.status(400).json({ message: 'First name, last name, email, and password are required' });
    return;
  }

  if (!acceptTerms) {
    res.status(400).json({ message: 'You must accept the terms and privacy policy' });
    return;
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ message: 'User with this email already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: fullName,
        phone,
        role: UserRole.USER,
        isEmailVerified: false,
        acceptedTermsAt: new Date(),
        acceptedPrivacyAt: new Date(),
        consentVersion: 'v1.0',
      },
    });

    // Generate Verification OTP
    const rawOtp = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(rawOtp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.otpVerification.deleteMany({ where: { email, purpose: OtpPurpose.SIGNUP } });
    await prisma.otpVerification.create({
      data: { email, otpHash, purpose: OtpPurpose.SIGNUP, expiresAt },
    });


          if (process.env.NODE_ENV !== 'production') {
          console.log(`🔑 [DEV VERIFY OTP] Code for ${email}: ${rawOtp}`);
}
  await sendOtpEmail(email, rawOtp);

    res.status(201).json({
      message: 'Registration successful. Please verify your email with the OTP sent.',
      userId: user.id,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- 2. Verify Email OTP ---
router.post('/verify-email', async (req: Request, res: Response): Promise<void> => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    res.status(400).json({ message: 'Email and OTP are required' });
    return;
  }

  try {
    const record = await prisma.otpVerification.findFirst({
      where: { email, purpose: OtpPurpose.SIGNUP, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    if (!record || !(await bcrypt.compare(otp, record.otpHash))) {
      res.status(400).json({ message: 'Invalid or expired verification code' });
      return;
    }

    await prisma.otpVerification.delete({ where: { id: record.id } });

    const user = await prisma.user.update({
      where: { email },
      data: { isEmailVerified: true },
    });

    const payload: JwtPayload = { userId: user.id, email: user.email, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '7d' });

    res.json({ token, role: user.role, email: user.email, userId: user.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- 3. Login (Email + Password) ---
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      res.status(400).json({ message: 'Invalid email or password' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid email or password' });
      return;
    }

    if (!user.isEmailVerified) {
      res.status(403).json({ message: 'Please verify your email before logging in.', isEmailVerified: false });
      return;
    }

    const payload: JwtPayload = { userId: user.id, email: user.email, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- 4. Forgot Password (Request OTP) ---
router.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ message: 'Email is required' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.json({ message: 'If an account exists with that email, a reset code was sent.' });
      return;
    }

    const rawOtp = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(rawOtp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.otpVerification.deleteMany({ where: { email, purpose: OtpPurpose.RESET_PASSWORD } });
    await prisma.otpVerification.create({
      data: { email, otpHash, purpose: OtpPurpose.RESET_PASSWORD, expiresAt },
    });

    if (process.env.NODE_ENV !== 'production') {
  console.log(`🔑 [DEV RESET OTP] Code for ${email}: ${rawOtp}`);
}

await sendOtpEmail(email, rawOtp);
    res.json({ message: 'If an account exists with that email, a reset code was sent.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- 5. Reset Password (Verify OTP & Change Password) ---
router.post('/reset-password', async (req: Request, res: Response): Promise<void> => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    res.status(400).json({ message: 'Email, OTP, and new password are required' });
    return;
  }

  try {
    const record = await prisma.otpVerification.findFirst({
      where: { email, purpose: OtpPurpose.RESET_PASSWORD, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    if (!record || !(await bcrypt.compare(otp, record.otpHash))) {
      res.status(400).json({ message: 'Invalid or expired reset code' });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email },
      data: { passwordHash },
    });

    await prisma.otpVerification.delete({ where: { id: record.id } });

    res.json({ message: 'Password updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;