// services/adminLedger.service.ts
import { PrismaClient, PaymentStatus, PaymentPurpose, RefundStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';

export async function getFinancialOverview(startDate?: Date, endDate?: Date) {
  const dateFilter = startDate && endDate ? { createdAt: { gte: startDate, lte: endDate } } : {};

  // Aggregate Total Gross Revenue (Successful Payments)
  const grossRevenue = await prisma.payment.aggregate({
    _sum: { amount: true, tax: true },
    _count: { id: true },
    where: { status: PaymentStatus.SUCCESS, ...dateFilter },
  });

  // Aggregate Processed Refunds
  const totalRefunds = await prisma.refund.aggregate({
    _sum: { amount: true },
    _count: { id: true },
    where: { status: RefundStatus.PROCESSED, ...dateFilter },
  });

  // Count Pending Refunds requiring action
  const pendingRefundsCount = await prisma.refund.count({
    where: { status: RefundStatus.REQUESTED },
  });

  const grossAmount = grossRevenue._sum.amount?.toNumber() || 0;
  const refundAmount = totalRefunds._sum.amount?.toNumber() || 0;

  return {
    metrics: {
      grossRevenue: grossAmount,
      totalTax: grossRevenue._sum.tax?.toNumber() || 0,
      totalRefunds: refundAmount,
      netRevenue: grossAmount - refundAmount,
      totalTransactions: grossRevenue._count.id,
      pendingRefundRequests: pendingRefundsCount,
    },
  };
}

export async function getTransactionLedger(params: {
  page?: number;
  limit?: number;
  status?: PaymentStatus;
  purpose?: PaymentPurpose;
}) {
  const page = params.page || 1;
  const limit = params.limit || 20;
  const skip = (page - 1) * limit;

  const where = {
    ...(params.status && { status: params.status }),
    ...(params.purpose && { purpose: params.purpose }),
  };

  const [transactions, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        refunds: true,
      },
    }),
    prisma.payment.count({ where }),
  ]);

  return {
    data: transactions,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}