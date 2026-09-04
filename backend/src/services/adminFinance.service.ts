// services/adminFinance.service.ts
import {RefundStatus, PaymentStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';

export interface ProcessRefundInput {
  refundId: string;
  adminUserId: string;
  action: 'APPROVE' | 'REJECT';
  rejectionReason?: string;
  gatewayRefundId?: string; // ID returned from Stripe/Razorpay
}

export async function processAdminRefund({
  refundId,
  adminUserId,
  action,
  rejectionReason,
  gatewayRefundId,
}: ProcessRefundInput) {
  return await prisma.$transaction(async (tx) => {
    // 1. Fetch Refund and related Payment
    const refund = await tx.refund.findUnique({
      where: { id: refundId },
      include: { payment: true },
    });

    if (!refund) throw new Error('Refund request not found.');
    if (refund.status !== RefundStatus.REQUESTED) {
      throw new Error(`Refund has already been processed with status: ${refund.status}`);
    }

    // 2. Reject Path
    if (action === 'REJECT') {
      const updatedRefund = await tx.refund.update({
        where: { id: refundId },
        data: {
          status: RefundStatus.REJECTED,
          reason: rejectionReason ? `${refund.reason} | Rejection Reason: ${rejectionReason}` : refund.reason,
          processedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: adminUserId,
          action: 'REFUND_REJECTED',
          entityType: 'Refund',
          entityId: refundId,
          metadata: { rejectionReason },
        },
      });

      return updatedRefund;
    }

    // 3. Approve Path
    const isFullRefund = refund.amount.equals(refund.payment.amount);
    const newPaymentStatus = isFullRefund ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED;

    // Update Payment status
    await tx.payment.update({
      where: { id: refund.paymentId },
      data: { status: newPaymentStatus },
    });

    // Update Refund record
    const processedRefund = await tx.refund.update({
      where: { id: refundId },
      data: {
        status: RefundStatus.PROCESSED,
        gatewayRefundId: gatewayRefundId || null,
        processedAt: new Date(),
      },
    });

    // Record Audit Log
    await tx.auditLog.create({
      data: {
        actorId: adminUserId,
        action: 'REFUND_PROCESSED',
        entityType: 'Refund',
        entityId: refundId,
        metadata: {
          amount: refund.amount.toString(),
          paymentId: refund.paymentId,
          gatewayRefundId,
        },
      },
    });

    return processedRefund;
  });
}