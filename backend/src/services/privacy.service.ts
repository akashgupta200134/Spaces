import { prisma } from '../lib/prisma';
import { DeletionStatus } from '@prisma/client';

export async function getPendingDeletions() {
  return await prisma.user.findMany({
    where: {
      deletionStatus: { in: [DeletionStatus.PENDING, DeletionStatus.IN_PROGRESS] },
    },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      deletionRequestedAt: true,
      deletionStatus: true,
      createdAt: true,
    },
    orderBy: { deletionRequestedAt: 'asc' },
  });
}

export async function processUserDeletion(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found.');

  // Set status to IN_PROGRESS first
  await prisma.user.update({
    where: { id: userId },
    data: { deletionStatus: DeletionStatus.IN_PROGRESS },
  });

  // GDPR Erasure: Anonymize personal identifying information while freeing unique indexes
  return await prisma.user.update({
    where: { id: userId },
    data: {
      name: 'Deleted User',
      email: `deleted_${userId.slice(0, 8)}@privacy.anonymized`,
      phone: null,            // Clears @unique constraint
      googleId: null,         // Clears @unique constraint
      passwordHash: null,
      profileImage: null,
      isEmailVerified: false,
      isPhoneVerified: false,
      consentVersion: null,
      acceptedTermsAt: null,
      acceptedPrivacyAt: null,
      deletionStatus: DeletionStatus.COMPLETED,
      deletedAt: new Date(),
    },
  });
}

export async function bumpConsentVersion(version: string, title: string, content?: string) {
  const existing = await prisma.termsConsentVersion.findUnique({ where: { version } });
  if (existing) {
    throw new Error(`Version "${version}" already exists.`);
  }

  // Deactivate all old versions
  await prisma.termsConsentVersion.updateMany({
    where: { isActive: true },
    data: { isActive: false },
  });

  // Create new active release
  return await prisma.termsConsentVersion.create({
    data: {
      version,
      title,
      content: content || null,
      isActive: true,
    },
  });
}

export async function getActiveConsentVersion() {
  return await prisma.termsConsentVersion.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateUserConsent(userId: string, version: string) {
  const now = new Date();
  return await prisma.user.update({
    where: { id: userId },
    data: {
      consentVersion: version,
      acceptedTermsAt: now,
      acceptedPrivacyAt: now,
    },
  });
}