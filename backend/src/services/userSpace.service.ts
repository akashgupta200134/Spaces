import { prisma } from '../lib/prisma';

export async function getActiveLocations() {
  return await prisma.location.findMany({
    where: { isActive: true },
    select: { id: true, city: true, state: true },
  });
}

export async function getAllFacilities() {
  return await prisma.facility.findMany({
    select: { id: true, name: true, icon: true },
  });
}

export async function searchSpaces(filters: {
  locationId?: string;
  search?: string;
  facilityIds?: string[];
}) {
  const { locationId, search, facilityIds } = filters;

  const where: any = { status: 'ACTIVE' };

  if (locationId) {
    where.locationId = locationId;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { address: { contains: search, mode: 'insensitive' } },
      { pincode: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (facilityIds && facilityIds.length > 0) {
    where.facilities = {
      some: {
        facilityId: { in: facilityIds },
      },
    };
  }

  return await prisma.space.findMany({
    where,
    select: {
      id: true,
      name: true,
      description: true,
      address: true,
      images: true,
      ratingAvg: true,
      reviewCount: true,
      openingTime: true,
      closingTime: true,
      facilities: {
        select: {
          facility: { select: { id: true, name: true, icon: true } },
        },
      },
      membershipPlans: {
        where: { isActive: true },
        select: { price: true, durationDays: true },
        take: 1,
        orderBy: { price: 'asc' },
      },
    },
  });
}

export async function getSpaceDetails(spaceId: string) {
  return await prisma.space.findUnique({
    where: { id: spaceId },
    include: {
      location: true,
      facilities: { include: { facility: true } },
      zones: { include: { seats: true } },
      membershipPlans: { where: { isActive: true } },
    },
  });
}