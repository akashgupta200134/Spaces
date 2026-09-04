// services/adminPolicy.service.ts
import { PaymentStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';

export interface CreatePolicyInput {
  spaceId?: string;
  appliesTo: 'BOOKING' | 'MEMBERSHIP';
  hoursBeforeStart: number;
  refundPercentage: number;
}

export async function createCancellationPolicy(data: CreatePolicyInput) {
  if (data.refundPercentage < 0 || data.refundPercentage > 100) {
    throw new Error('Refund percentage must be between 0 and 100.');
  }

  return await prisma.cancellationPolicy.create({
    data: {
      spaceId: data.spaceId || null,
      appliesTo: data.appliesTo,
      hoursBeforeStart: Number(data.hoursBeforeStart),
      refundPercentage: Number(data.refundPercentage),
    },
  });
}

// Fetch all cancellation policies
export async function getCancellationPolicies() {
  return await prisma.cancellationPolicy.findMany({
    orderBy: {
      hoursBeforeStart: 'desc', // Valid field in CancellationPolicy schema
    },
  });
}

// Delete a cancellation policy by ID
export async function deleteCancellationPolicy(id: string) {
  return await prisma.cancellationPolicy.delete({
    where: { id },
  });
}

export async function calculateRefundAmount(bookingId: string, cancelledAt: Date = new Date()) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      space: { include: { cancellationPolicies: true } },
      payments: { where: { status: PaymentStatus.SUCCESS } },
    },
  });

  const payment = booking?.payments[0];

  if (!booking || !payment) {
    return { eligibleRefundAmount: 0, percentageApplied: 0 };
  }

  const hoursUntilStart = (booking.startTime.getTime() - cancelledAt.getTime()) / (1000 * 60 * 60);

  const policies = (booking.space?.cancellationPolicies || [])
    .filter((p) => p.appliesTo === 'BOOKING')
    .sort((a, b) => b.hoursBeforeStart - a.hoursBeforeStart);

  let applicablePercentage = 0;

  for (const policy of policies) {
    if (hoursUntilStart >= policy.hoursBeforeStart) {
      applicablePercentage = policy.refundPercentage;
      break;
    }
  }

  const eligibleRefundAmount = (payment.amount.toNumber() * applicablePercentage) / 100;

  return {
    paymentId: payment.id,
    totalPaid: payment.amount.toNumber(),
    hoursUntilStart,
    percentageApplied: applicablePercentage,
    eligibleRefundAmount,
  };
}