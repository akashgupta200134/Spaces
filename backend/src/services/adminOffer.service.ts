import { prisma } from '../lib/prisma';

export interface CreateOfferInput {
  code: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  validFrom: Date;
  validTo: Date;
  usageLimit?: number | null | undefined;
  planId?: string | null | undefined;
}

export async function createOffer(data: CreateOfferInput) {
  const normalizedCode = data.code.trim().toUpperCase();

  const existing = await prisma.offer.findUnique({ where: { code: normalizedCode } });
  if (existing) {
    throw new Error(`Promo code "${normalizedCode}" already exists.`);
  }

  if (data.validTo <= data.validFrom) {
    throw new Error('Validity end date must be after start date.');
  }

  return await prisma.offer.create({
    data: {
      code: normalizedCode,
      type: data.type,
      value: data.value,
      validFrom: data.validFrom,
      validTo: data.validTo,
      usageLimit: data.usageLimit || null,
      planId: data.planId || null,
    },
    include: {
      plan: { select: { id: true, name: true } },
    },
  });
}

export async function getAllOffers() {
  return await prisma.offer.findMany({
    include: {
      plan: { select: { id: true, name: true } },
    },
    orderBy: { validFrom: 'desc' },
  });
}

export async function deleteOffer(id: string) {
  return await prisma.offer.delete({
    where: { id },
  });
}

export async function validateAndApplyOffer(
  code: string,
  bookingAmount: number,
  targetPlanId?: string
) {
  const normalizedCode = code.trim().toUpperCase();
  const offer = await prisma.offer.findUnique({
    where: { code: normalizedCode },
    include: { plan: { select: { name: true } } },
  });

  if (!offer) {
    throw new Error('Invalid promo code.');
  }

  const now = new Date();
  if (now < offer.validFrom || now > offer.validTo) {
    throw new Error('This promo code is either not active yet or has expired.');
  }

  if (offer.usageLimit !== null && offer.usedCount >= offer.usageLimit) {
    throw new Error('This promo code has reached its maximum usage limit.');
  }

  // Plan targeting validation
  if (offer.planId && offer.planId !== targetPlanId) {
    throw new Error(
      `This promo code is strictly applicable to the "${offer.plan?.name || 'specific'}" membership plan.`
    );
  }

  let discount = 0;
  const offerValue = Number(offer.value);

  if (offer.type === 'PERCENTAGE') {
    discount = (bookingAmount * offerValue) / 100;
  } else {
    discount = Math.min(offerValue, bookingAmount);
  }

  return {
    offerId: offer.id,
    code: offer.code,
    discountAmount: Math.round(discount * 100) / 100,
    finalAmount: Math.max(0, Math.round((bookingAmount - discount) * 100) / 100),
  };
}