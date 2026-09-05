import { prisma } from '../lib/prisma';
import { UserRole } from '@prisma/client';

export interface BroadcastInput {
  title: string;
  message: string;
  type: 'ANNOUNCEMENT' | 'MAINTENANCE' | 'LOCATION_NOTICE' | 'ALERT';
  targetRole?: 'ALL' | 'USER' | 'SPACE_MANAGER' | undefined;
  spaceId?: string;
}

export async function createBroadcastNotification(input: BroadcastInput) {
  const { title, message, type, targetRole = 'ALL', spaceId } = input;

  let targetUsers: { id: string }[] = [];

  if (spaceId) {
    // Filter users specifically associated with this space
    const conditions: any[] = [];

    if (targetRole === 'ALL' || targetRole === 'USER') {
      conditions.push(
        { bookings: { some: { spaceId } } },
        { memberships: { some: { spaceId } } }
      );
    }

    if (targetRole === 'ALL' || targetRole === 'SPACE_MANAGER') {
      conditions.push({ spaceManager: { spaceId } });
    }

    targetUsers = await prisma.user.findMany({
      where: { OR: conditions },
      select: { id: true },
    });
  } else {
    // Platform-wide targeting
    const whereRole: any = {};
    if (targetRole === 'USER') {
      whereRole.role = UserRole.USER;
    } else if (targetRole === 'SPACE_MANAGER') {
      whereRole.role = UserRole.SPACE_MANAGER;
    }

    targetUsers = await prisma.user.findMany({
      where: whereRole,
      select: { id: true },
    });
  }

  if (targetUsers.length === 0) {
    return { count: 0, recipientCount: 0, message: 'No target users found for this selection.' };
  }

  const notificationsData = targetUsers.map((u) => ({
    userId: u.id,
    title,
    message,
    type,
    targetRole,
  }));

  const result = await prisma.notification.createMany({
    data: notificationsData,
  });

  return {
    count: result.count,
    recipientCount: targetUsers.length,
  };
}

export async function getBroadcastHistory(limit = 50) {
  return await prisma.notification.findMany({
    orderBy: { createdAt: 'desc' },
    distinct: ['title', 'createdAt'],
    take: limit,
    select: {
      id: true,
      title: true,
      message: true,
      type: true,
      targetRole: true,
      createdAt: true,
    },
  });
}