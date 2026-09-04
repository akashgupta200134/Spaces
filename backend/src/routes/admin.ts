import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { UserRole, OtpPurpose } from '@prisma/client';
import prisma from '../lib/prisma';
import { authenticateToken, requireRole } from '../middleware/auth';
import { sendOtpEmail } from '../lib/email';

const router = Router();

interface CreateManagerBody {
  email: string;
  name?: string;
  spaceId?: string;
}

// GET /api/admin/stats - Live DB metrics for dashboard overview
router.get(
  '/stats',
  authenticateToken,
  requireRole([UserRole.ADMIN]),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const totalUsers = await prisma.user.count();
      const verifiedUsers = await prisma.user.count({ where: { isEmailVerified: true } });
      const adminCount = await prisma.user.count({ where: { role: UserRole.ADMIN } });
      const pendingVerifications = totalUsers - verifiedUsers;

      res.json({
        totalUsers,
        verifiedUsers,
        adminCount,
        pendingVerifications,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

// POST /api/admin/create-manager - Create space manager & invite via EmailJS
router.post(
  '/create-manager',
  authenticateToken,
  requireRole([UserRole.ADMIN]),
  async (req: Request<{}, {}, CreateManagerBody>, res: Response): Promise<void> => {
    const { email, name, spaceId } = req.body;
    if (!email) {
      res.status(400).json({ message: 'Manager email required' });
      return;
    }

    try {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        res.status(400).json({ message: 'User already exists' });
        return;
      }

      const manager = await prisma.user.create({
        data: {
          email,
          name: name || 'Space Manager',
          role: UserRole.SPACE_MANAGER,
          isEmailVerified: false,
        },
      });

      if (spaceId) {
        await prisma.spaceManager.create({
          data: { userId: manager.id, spaceId },
        });
      }

      const rawOtp = crypto.randomInt(100000, 999999).toString();
      const otpHash = await bcrypt.hash(rawOtp, 10);

      await prisma.otpVerification.create({
        data: {
          email,
          otpHash,
          purpose: OtpPurpose.LOGIN,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      if (process.env.NODE_ENV !== 'production') {
        console.log(`🔑 [DEV MANAGER OTP] Code for ${email}: ${rawOtp}`);
      }

      await sendOtpEmail(email, rawOtp);

      res.json({ message: 'Space Manager created and invitation sent successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

// GET /api/admin/users - Get list of all users
router.get(
  '/users',
  authenticateToken,
  requireRole([UserRole.ADMIN]),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isEmailVerified: true,
          createdAt: true,
          managedSpaces: {
            include: { space: { select: { id: true, name: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      res.json(users);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

export default router;