import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { DeletionStatus, UserRole } from '@prisma/client';
import prisma from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

// GET /api/user/profile
router.get('/profile', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        profileImage: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        createdAt: true,
        deletionStatus: true,
        memberships: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            startDate: true,
            endDate: true,
            status: true,
            memberCode: true,
            plan: { select: { name: true, price: true, durationDays: true } },
            space: { select: { name: true } },
          },
          take: 1,
          orderBy: { endDate: 'desc' },
        },
        _count: {
          select: {
            bookings: true,
            reviews: true,
            favorites: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/user/profile
router.put('/profile', async (req: Request, res: Response): Promise<void> => {
  const { name, phone } = req.body;

  try {
    const data: Record<string, any> = {};
    if (name !== undefined) data.name = name.trim();
    if (phone !== undefined) data.phone = phone.trim() || null;

    if (Object.keys(data).length === 0) {
      res.status(400).json({ message: 'No fields to update' });
      return;
    }

    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        profileImage: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    res.json({ user });
  } catch (err: any) {
    if (err.code === 'P2002' && err.meta?.target?.includes('phone')) {
      res.status(400).json({ message: 'This phone number is already in use' });
      return;
    }
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/user/change-password
router.put('/change-password', async (req: Request, res: Response): Promise<void> => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400).json({ message: 'Current and new passwords are required' });
    return;
  }
  if (newPassword.length < 6) {
    res.status(400).json({ message: 'New password must be at least 6 characters' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user || !user.passwordHash) {
      res.status(400).json({ message: 'Cannot change password for this account' });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({ message: 'Current password is incorrect' });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    res.json({ message: 'Password updated successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/user/account
router.delete('/account', async (req: Request, res: Response): Promise<void> => {
  const { password } = req.body;

  if (!password) {
    res.status(400).json({ message: 'Password is required to delete your account' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user || !user.passwordHash) {
      res.status(400).json({ message: 'Account not found' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({ message: 'Incorrect password' });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        deletionStatus: DeletionStatus.PENDING,
        deletionRequestedAt: new Date(),
      },
    });

    res.json({ message: 'Account deletion requested. Your data will be removed within 30 days.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/user/notifications
router.get('/notifications', async (req: Request, res: Response): Promise<void> => {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { userId: req.user!.userId },
          { targetRole: { in: ['ALL', 'USER'] } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({ notifications });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/user/notifications/:id/read
router.put('/notifications/:id/read', async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.notification.update({
      where: { id: req.params.id as string },
      data: { isRead: true },
    });
    res.json({ message: 'Marked as read' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
