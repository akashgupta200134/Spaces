import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { calculateRefundAmount, createCancellationPolicy, deleteCancellationPolicy, getCancellationPolicies } from '../services/adminPolicy.service';
import { processAdminRefund } from '../services/adminFinance.service';
import { getFinancialOverview, getTransactionLedger } from '../services/adminLedger.service';
import { createOffer, CreateOfferInput, deleteOffer, getAllOffers, validateAndApplyOffer } from '../services/adminOffer.service';
import { bumpConsentVersion, getActiveConsentVersion, getPendingDeletions, processUserDeletion } from '../services/privacy.service';
import { getModerationQueue, getRatingAnomalyAlerts, toggleReviewVisibility } from '../services/moderation.service';
import { addTicketMessage, getTicketDetails, getTickets, reassignTicket, updateTicketMetadata } from '../services/ticket.service';
import { AuditFilterOptions, getActorTraceability, getAuditLogs } from '../services/audit.service';
import { createBroadcastNotification, getBroadcastHistory } from '../services/notification.service';
const router = Router();





// GET /admin/users - Fetch standard users
router.get('/users', async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: "USER"
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isEmailVerified: true,
        role: true,
        createdAt: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});


// GET /admin/users/:id - Fetch full detailed user analytics
router.get('/users/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    // 1. Fetch base user info
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 2. Fetch total bookings count safely
    let totalBookings = 0;
    try {
      const bookingDelegate = (prisma as any).booking || (prisma as any).spaceBooking;
      if (bookingDelegate) {
        totalBookings = await bookingDelegate.count({
          where: { userId: id },
        });
      }
    } catch (err) {
      console.warn('Could not fetch booking count:', err);
    }

    // 3. Fetch user membership safely
    let activeMembership = null;
    try {
      const membershipDelegate =
        (prisma as any).userMembership ||
        (prisma as any).membership ||
        (prisma as any).subscription;

      if (membershipDelegate) {
        activeMembership = await membershipDelegate.findFirst({
          where: { userId: id },
          include: {
            plan: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });
      }
    } catch (err) {
      console.warn('Could not fetch membership details:', err);
    }

    // 4. Return aggregated response
    res.json({
      ...user,
      membership: activeMembership,
      totalBookings,
    });
  } catch (error) {
    console.error('Failed to fetch user details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==========================================
// 1. LOCATION MANAGEMENT
// ==========================================

router.get('/locations', async (req: Request, res: Response) => {
  try {
    const locations = await prisma.location.findMany({ 
      where: { isActive: true },
      orderBy: { city: 'asc' },
    });
    res.json(locations);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch locations', error: error.message });
  }
});

router.post('/locations', async (req: Request, res: Response) => {
  const { city, state } = req.body;
  if (!city || !state) {
    return res.status(400).json({ message: 'City and State are required.' });
  }

  try {
    const location = await prisma.location.create({
      data: { city: city.trim(), state: state.trim() },
    });
    res.status(201).json(location);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to create location', error: error.message });
  }
});

// ==========================================
// 2. SPACE MANAGEMENT
// ==========================================

router.get('/spaces', async (req: Request, res: Response) => {
  try {
    const spaces = await prisma.space.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        location: {
          select: { city: true, state: true },
        },
      },
      orderBy: { name: 'asc' },
    });
    res.json(spaces);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch spaces', error: error.message });
  }
});


router.get('/spaces/all', async (req: Request, res: Response) => {
  try {
    const spaces = await prisma.space.findMany({
      include: {
        location: true,
        facilities: {
          include: {
            facility: true,
          },
        },
      },
    });

    // Transform facilities relations into flat string array expected by UI
    const formattedSpaces = spaces.map((space) => ({
      ...space,
      amenities: space.facilities?.map((f) => f.facility.name) || [],
    }));

    return res.json(formattedSpaces);
  } catch (error) {
    console.error('Failed to fetch spaces:', error);
    return res.status(500).json({ message: 'Failed to fetch spaces' });
  }
});



router.post('/spaces', async (req: Request, res: Response) => {
  const {
    locationId,
    name,
    description,
    address,
    pincode,
    latitude,
    longitude,
    phone,
    email,
    openingTime,
    closingTime,
    capacity,
    images,
  } = req.body;

  if (
    !locationId ||
    !name ||
    !address ||
    !pincode ||
    latitude === undefined ||
    longitude === undefined ||
    !openingTime ||
    !closingTime ||
    !capacity
  ) {
    return res.status(400).json({ message: 'Missing required space fields.' });
  }

  const formattedImages: string[] = Array.isArray(images)
    ? images
    : images
    ? [images]
    : [];

  try {
    const space = await prisma.space.create({
      data: {
        locationId,
        name,
        description: description || null,
        address,
        pincode,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        phone: phone || null,
        email: email || null,
        openingTime,
        closingTime,
        capacity: parseInt(capacity, 10),
        images: formattedImages,
        status: 'ACTIVE',
      },
    });

    res.status(201).json(space);
  } catch (error: any) {
    console.error('Error creating space:', error);
    res.status(500).json({ message: 'Failed to create space record.', error: error.message });
  }
});



// ==========================================
// 3. SPACE MANAGER CRUD & USER ACTIONS
// ==========================================

router.get('/space-managers', async (req: Request, res: Response) => {
  try {
    const managers = await prisma.user.findMany({
      where: {
        role: "SPACE_MANAGER"
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isEmailVerified: true,
        createdAt: true,
        spaceManager: { // <--- Queries the 1-to-1 relation
          select: {
            id: true,
            spaceId: true,
            space: {
              select: {
                id: true,
                name: true,
                location: {
                  select: {
                    city: true,
                    state: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    // Transform 1-to-1 spaceManager object into managedSpaces array for frontend compatibility
    const formattedManagers = managers.map((manager) => ({
      ...manager,
      managedSpaces: manager.spaceManager ? [manager.spaceManager] : []
    }));

    res.json(formattedManagers); // <--- Send formatted output
  } catch (error) {
    console.error("Error fetching space managers:", error);
    res.status(500).json({ error: "Failed to fetch space managers" });
  }
});

router.post('/space-managers', async (req: Request, res: Response) => {
  const { name, email, phone, password, spaceId } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    if (spaceId) {
      const spaceExists = await prisma.space.findUnique({ where: { id: spaceId } });
      if (!spaceExists) {
        return res.status(404).json({ message: 'Selected space does not exist.' });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          phone: phone || null,
          passwordHash,
          role: 'SPACE_MANAGER',
          isEmailVerified: true,
        },
      });

      const spaceManager = await tx.spaceManager.create({
        data: {
          userId: user.id,
          spaceId: spaceId || null,
        },
      });

      return { user, spaceManager };
    });

    res.status(201).json({ message: 'Space Manager created successfully', result });
  } catch (error: any) {
    console.error('Error creating space manager:', error);
    res.status(500).json({ message: 'Failed to create manager account', error: error.message });
  }
});

// LEGACY ALIAS: /create-manager
router.post('/create-manager', async (req: Request, res: Response) => {
  const { name, email, password, spaceId } = req.body;
  
  if (!name || !email || !password || !spaceId) {
    return res.status(400).json({ message: 'All fields (Name, Email, Password, Space) are required.' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'A user with this email already exists.' });
    }

    const spaceExists = await prisma.space.findUnique({ where: { id: spaceId } });
    if (!spaceExists) {
      return res.status(404).json({ message: 'Selected space does not exist.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: 'SPACE_MANAGER',
          isEmailVerified: true,
        },
      });

      const newManagerLink = await tx.spaceManager.create({
        data: {
          userId: newUser.id,
          spaceId,
        },
      });

      return { newUser, newManagerLink };
    });

    res.status(201).json({
      message: 'Space Manager created and assigned successfully.',
      managerId: result.newUser.id,
      spaceId: result.newManagerLink.spaceId,
    });
  } catch (error: any) {
    console.error('Error creating Space Manager:', error);
    res.status(500).json({ message: 'Failed to create Space Manager account.' });
  }
});

// UPDATE MANAGER DETAILS & REASSIGN SPACE
router.put('/space-managers/:userId', async (req: Request<{ userId: string }>, res: Response) => {
  const { userId } = req.params;
  const { name, email, phone, spaceId } = req.body;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ message: 'Valid userId parameter is required.' });
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { name, email, phone: phone || null },
      });

      const existingMapping = await tx.spaceManager.findFirst({ where: { userId } });
      if (existingMapping) {
        await tx.spaceManager.update({
          where: { id: existingMapping.id },
          data: { spaceId: spaceId || null },
        });
      } else {
        await tx.spaceManager.create({
          data: { userId, spaceId: spaceId || null },
        });
      }
    });

    res.json({ message: 'Manager details updated successfully.' });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to update manager details', error: error.message });
  }
});

// RESET MANAGER PASSWORD
router.patch('/space-managers/:userId/password', async (req: Request<{ userId: string }>, res: Response) => {
  const { userId } = req.params;
  const { newPassword } = req.body;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ message: 'Valid userId parameter is required.' });
  }

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
  }

  try {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    res.json({ message: 'Password updated successfully.' });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to update password', error: error.message });
  }
});

// BLOCK / UNBLOCK MANAGER STATUS
router.patch('/space-managers/:userId/status', async (req: Request<{ userId: string }>, res: Response) => {
  const { userId } = req.params;
  const { isEmailVerified } = req.body;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ message: 'Valid userId parameter is required.' });
  }

  if (typeof isEmailVerified !== 'boolean') {
    return res.status(400).json({ message: 'isEmailVerified boolean state is required.' });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isEmailVerified },
      select: { id: true, email: true, isEmailVerified: true },
    });

    res.json({ message: 'Manager status updated successfully.', user: updatedUser });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to update manager status', error: error.message });
  }
});

// DELETE SPACE MANAGER
router.delete('/space-managers/:userId', async (req: Request<{ userId: string }>, res: Response) => {
  const { userId } = req.params;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ message: 'Valid userId parameter is required.' });
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.spaceManager.deleteMany({ where: { userId } });
      await tx.user.delete({ where: { id: userId } });
    });

    res.json({ message: 'Space Manager deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to delete manager account', error: error.message });
  }
});



// PUT /admin/spaces/:id - Update space details

router.put('/spaces/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const {
      locationId,
      name,
      description,
      address,
      pincode,
      latitude,
      longitude,
      phone,
      email,
      openingTime,
      closingTime,
      capacity,
      status,
      images,
      amenities, // Expected array of strings, e.g. ["Wi-Fi", "Air Conditioning"]
    } = req.body;

    const updateData: Record<string, any> = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (address !== undefined) updateData.address = address;
    if (pincode !== undefined) updateData.pincode = pincode;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (openingTime !== undefined) updateData.openingTime = openingTime;
    if (closingTime !== undefined) updateData.closingTime = closingTime;
    if (capacity !== undefined) updateData.capacity = Number(capacity);
    if (status !== undefined) updateData.status = status;
    if (images !== undefined) updateData.images = images;

    if (latitude !== undefined && latitude !== null && latitude !== '') {
      updateData.latitude = Number(latitude);
    }
    if (longitude !== undefined && longitude !== null && longitude !== '') {
      updateData.longitude = Number(longitude);
    }
    if (locationId) {
      updateData.location = { connect: { id: locationId } };
    }

    // 1. Update space scalar fields
    await prisma.space.update({
      where: { id },
      data: updateData,
    });

    // 2. Sync facilities if amenities array is sent
    if (Array.isArray(amenities)) {
      // Remove old space-facility relationships
      await prisma.spaceFacility.deleteMany({
        where: { spaceId: id },
      });

      if (amenities.length > 0) {
        // Upsert facilities to guarantee they exist in parallel
        const facilityRecords = await Promise.all(
          amenities.map((facilityName: string) =>
            prisma.facility.upsert({
              where: { name: facilityName },
              update: {},
              create: { name: facilityName },
            })
          )
        );

        // Bulk-create junction records
        await prisma.spaceFacility.createMany({
          data: facilityRecords.map((facility) => ({
            spaceId: id,
            facilityId: facility.id,
          })),
          skipDuplicates: true,
        });
      }
    }

    // 3. Fetch fresh space with relation details
    const updatedSpace = await prisma.space.findUnique({
      where: { id },
      include: {
        location: true,
        facilities: {
          include: {
            facility: true,
          },
        },
      },
    });

    const formatted = {
      ...updatedSpace,
      amenities: updatedSpace?.facilities.map((f) => f.facility.name) || [],
    };

    return res.json(formatted);
  } catch (error) {
    console.error('Failed to update space:', error);
    return res.status(500).json({ message: 'Failed to update space details' });
  }
});


// PATCH /admin/spaces/:id/status - Quick status change (ACTIVE, MAINTENANCE, INACTIVE)
router.patch('/spaces/:id/status', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    const updatedSpace = await prisma.space.update({
      where: { id },
      data: { status },
    });

    return res.json(updatedSpace);
  } catch (error) {
    console.error('Failed to update status:', error);
    return res.status(500).json({ message: 'Failed to update status' });
  }
});

// DELETE /admin/spaces/:id - Delete space
router.delete('/spaces/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    await prisma.space.delete({
      where: { id },
    });

    return res.json({ message: 'Space deleted successfully' });
  } catch (error) {
    console.error('Failed to delete space:', error);
    return res.status(500).json({ message: 'Failed to delete space' });
  }
});

// ==========================================
// 4. SYSTEM STATISTICS
// ==========================================
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const [
      totalSpaces,
      activeSpaces,
      totalLocations,
      spaceManagers,
      totalUsers,
      verifiedUsers,
      adminCount,
      pendingVerifications,
      totalMembershipPlans,
      activeMembershipPlans,
      activeSubscriptions,
      totalSubscriptions,
    ] = await Promise.all([
      prisma.space.count(),
      prisma.space.count({ where: { status: 'ACTIVE' } }),
      prisma.location.count(),
      prisma.user.count({ where: { role: 'SPACE_MANAGER' } }),
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.user.count({ where: { role: 'USER', isEmailVerified: true } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({ where: { role: 'USER', isEmailVerified: false } }),

      // Membership Plan Queries
      prisma.membershipPlan.count(),
      prisma.membershipPlan.count({ where: { isActive: true } }),

      // User Membership (Subscription) Queries
      prisma.membership.count({ where: { status: 'ACTIVE' } }),
      prisma.membership.count(),
    ]);

    res.json({
      totalSpaces,
      activeSpaces,
      totalLocations,
      spaceManagers,
      totalUsers,
      verifiedUsers,
      adminCount,
      pendingVerifications,
      totalMembershipPlans,
      activeMembershipPlans,
      activeSubscriptions,
      totalSubscriptions,
    });
  } catch (error: any) {
    console.error('Error fetching admin statistics:', error);
    res.status(500).json({ message: 'Failed to fetch admin statistics', error: error.message });
  }
});




// GET /api/admin/analytics
router.get('/analytics', async (req: Request, res: Response) => {
  const timeRange = (req.query.timeRange as string) || '30d';

  const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
  const days = daysMap[timeRange] || 30;
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  try {
    // 1. Parallel Core Database Queries
    const [
      successfulPayments,
      refundsAgg,
      bookings,
      activeMembershipsCount,
      checkIns,
      spaces
    ] = await Promise.all([
      // Revenue by Status and Purpose
      prisma.payment.findMany({
        where: { createdAt: { gte: startDate }, status: 'SUCCESS' },
        select: { amount: true, purpose: true, method: true, createdAt: true }
      }),
      // Total Refunded Amount
      prisma.refund.aggregate({
        where: { createdAt: { gte: startDate }, status: 'PROCESSED' },
        _sum: { amount: true }
      }),
      // Bookings Summary
      prisma.booking.findMany({
        where: { date: { gte: startDate } },
        select: { id: true, status: true, date: true, startTime: true, endTime: true }
      }),
      // Active Memberships
      prisma.membership.count({
        where: { status: 'ACTIVE' }
      }),
      // Check-In Operational Metrics
      prisma.checkIn.findMany({
        where: { checkInTime: { gte: startDate } },
        select: { id: true, isOverstay: true, isNoShow: true, checkOutTime: true }
      }),
      // Space Performance Data
      prisma.space.findMany({
        include: {
          location: true,
          bookings: {
            where: { date: { gte: startDate }, status: 'CONFIRMED' },
            include: { payments: { where: { status: 'SUCCESS' } } }
          }
        }
      })
    ]);

    // 2. Compute Top-Line Metrics
    const grossRevenue = successfulPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const totalRefunds = Number(refundsAgg._sum.amount || 0);
    const netRevenue = Math.max(0, grossRevenue - totalRefunds);

    const bookingRevenue = successfulPayments
      .filter(p => p.purpose === 'BOOKING')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const membershipRevenue = successfulPayments
      .filter(p => p.purpose === 'MEMBERSHIP' || p.purpose === 'RENEWAL')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter(b => b.status === 'CONFIRMED' || b.status === 'COMPLETED');
    const cancelledBookings = bookings.filter(b => b.status === 'CANCELLED');
    const cancellationRate = totalBookings > 0 ? Math.round((cancelledBookings.length / totalBookings) * 100) : 0;

    // Operational Health Calculations
    const totalCheckIns = checkIns.length;
    const overstayCount = checkIns.filter(c => c.isOverstay).length;
    const noShowCount = checkIns.filter(c => c.isNoShow).length;
    const overstayRate = totalCheckIns > 0 ? Math.round((overstayCount / totalCheckIns) * 100) : 0;

    // Reserved Hours calculation
    const totalReservedHours = confirmedBookings.reduce((sum, b) => {
      const diffMs = new Date(b.endTime).getTime() - new Date(b.startTime).getTime();
      const hours = diffMs / (1000 * 60 * 60);
      return sum + (hours > 0 ? hours : 2); // Default to 2 hours if standard slot
    }, 0);

    // 3. Time-Series Chart Aggregation (Dynamic Date Buckets)
    const chartBucketCount = days <= 7 ? 7 : days <= 30 ? 10 : 12;
    const intervalMs = (days * 24 * 60 * 60 * 1000) / chartBucketCount;
    
    const timeSeries = Array.from({ length: chartBucketCount }).map((_, idx) => {
      const bucketStart = new Date(startDate.getTime() + idx * intervalMs);
      const bucketEnd = new Date(startDate.getTime() + (idx + 1) * intervalMs);

      const bucketRevenue = successfulPayments
        .filter(p => p.createdAt >= bucketStart && p.createdAt < bucketEnd)
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);

      const bucketBookingCount = bookings.filter(
        b => b.date >= bucketStart && b.date < bucketEnd && b.status === 'CONFIRMED'
      ).length;

      const dateLabel = bucketStart.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });

      return { label: dateLabel, revenue: bucketRevenue, bookings: bucketBookingCount };
    });

    // 4. Workspace Ranking & Occupancy Breakdown
    const topSpaces = spaces
      .map(space => {
        const spaceRevenue = space.bookings.reduce((sum, b) => {
          return sum + b.payments.reduce((pSum, p) => pSum + Number(p.amount || 0), 0);
        }, 0);

        const occupancyRate = space.capacity > 0
          ? Math.min(Math.round((space.bookings.length / (space.capacity * days)) * 100), 100)
          : 0;

        return {
          id: space.id,
          name: space.name,
          location: space.location ? `${space.location.city}, ${space.location.state}` : 'Unassigned',
          revenue: spaceRevenue,
          occupancy: occupancyRate,
          bookingsCount: space.bookings.length,
          rating: space.ratingAvg || 4.5,
          reviewCount: space.reviewCount || 0
        };
      })
      .sort((a, b) => b.revenue - a.revenue);

    const overallOccupancy = topSpaces.length > 0
      ? Math.round(topSpaces.reduce((acc, s) => acc + s.occupancy, 0) / topSpaces.length)
      : 0;

    return res.json({
      summary: {
        grossRevenue,
        netRevenue,
        totalRefunds,
        totalBookings,
        confirmedBookingsCount: confirmedBookings.length,
        cancellationRate,
        activeMemberships: activeMembershipsCount,
        reservedHours: Math.round(totalReservedHours),
        overallOccupancy,
        totalCheckIns,
        overstayRate,
        noShowCount
      },
      revenueBreakdown: {
        bookingRevenue,
        membershipRevenue
      },
      timeSeries,
      topSpaces
    });
  } catch (error) {
    console.error('Advanced Analytics Error:', error);
    return res.status(500).json({ error: 'Failed to compute analytics data' });
  }
});



// ==========================================
// MEMBERSHIP PLAN MANAGEMENT
// ==========================================

// GET /admin/membership-plans - List all plans (Optional filter ?spaceId=xxx)
router.get('/membership-plans', async (req: Request, res: Response) => {
  try {
    const rawSpaceId = req.query.spaceId;
    
    // Construct 'where' dynamically to satisfy exactOptionalPropertyTypes
    const where = typeof rawSpaceId === 'string' && rawSpaceId.trim() !== ''
      ? { spaceId: rawSpaceId }
      : {};

    const plans = await prisma.membershipPlan.findMany({
      where,
      include: {
        space: {
          select: {
            id: true,
            name: true,
            location: {
              select: { city: true, state: true },
            },
          },
        },
      },
      orderBy: { price: 'asc' },
    });

    return res.json(plans);
  } catch (error: any) {
    console.error('Failed to fetch membership plans:', error);
    return res.status(500).json({ message: 'Failed to fetch membership plans', error: error.message });
  }
});

// POST /admin/membership-plans - Create a new membership plan
// POST /admin/membership-plans - Create a new membership plan

// POST /admin/membership-plans - Create a new membership plan
// POST /admin/membership-plans - Create a new membership plan
router.post('/membership-plans', async (req: Request, res: Response) => {
  const {
    spaceId,
    name,
    description,
    price,
    tax,
    durationDays,
    maxUsage,
    accessHours,
    isActive,
  } = req.body;

  if (!name || typeof name !== 'string' || price === undefined || !durationDays) {
    return res.status(400).json({
      message: 'Missing required fields: name, price, and durationDays are required.',
    });
  }

  try {
    if (spaceId) {
      const spaceExists = await prisma.space.findUnique({ where: { id: spaceId } });
      if (!spaceExists) {
        return res.status(404).json({ message: 'Target space does not exist.' });
      }
    }

    const plan = await prisma.membershipPlan.create({
      data: {
        name,
        price: parseFloat(price),
        durationDays: parseInt(durationDays, 10),
        tax: tax !== undefined ? parseFloat(tax) : 0,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        spaceId: spaceId || undefined,
        description: description || undefined,
        maxUsage: maxUsage !== undefined && maxUsage !== null && maxUsage !== '' ? parseInt(maxUsage, 10) : undefined,
        accessHours: accessHours || undefined,
      },
      include: {
        space: {
          select: { id: true, name: true },
        },
      },
    });

    return res.status(201).json(plan);
  } catch (error: any) {
    console.error('Error creating membership plan:', error);
    return res.status(500).json({ message: 'Failed to create membership plan.', error: error.message });
  }
});

// PUT /admin/membership-plans/:id - Update an existing plan
router.put('/membership-plans/:id', async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Valid Plan ID parameter is required.' });
  }

  const {
    spaceId,
    name,
    description,
    price,
    tax,
    durationDays,
    maxUsage,
    accessHours,
    isActive,
  } = req.body;

  try {
    const updateData: Record<string, any> = {};

    if (typeof spaceId === 'string') updateData.spaceId = spaceId;
    if (typeof name === 'string') updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (tax !== undefined) updateData.tax = parseFloat(tax);
    if (durationDays !== undefined) updateData.durationDays = parseInt(durationDays, 10);
    if (maxUsage !== undefined) updateData.maxUsage = maxUsage === null ? null : parseInt(maxUsage, 10);
    if (accessHours !== undefined) updateData.accessHours = accessHours;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updatedPlan = await prisma.membershipPlan.update({
      where: { id },
      data: updateData,
      include: {
        space: { select: { id: true, name: true } },
      },
    });

    return res.json(updatedPlan);
  } catch (error: any) {
    console.error('Failed to update membership plan:', error);
    return res.status(500).json({ message: 'Failed to update membership plan', error: error.message });
  }
});

// PATCH /admin/membership-plans/:id/status - Toggle active status
router.patch('/membership-plans/:id/status', async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  const { isActive } = req.body;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Valid Plan ID parameter is required.' });
  }

  if (typeof isActive !== 'boolean') {
    return res.status(400).json({ message: 'isActive boolean status is required.' });
  }

  try {
    const updatedPlan = await prisma.membershipPlan.update({
      where: { id },
      data: { isActive },
    });

    return res.json(updatedPlan);
  } catch (error: any) {
    console.error('Failed to update plan status:', error);
    return res.status(500).json({ message: 'Failed to update plan status', error: error.message });
  }
});

// DELETE /admin/membership-plans/:id - Delete a plan
router.delete('/membership-plans/:id', async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Valid Plan ID parameter is required.' });
  }

  try {
    await prisma.membershipPlan.delete({
      where: { id },
    });

    return res.json({ message: 'Membership plan deleted successfully.' });
  } catch (error: any) {
    console.error('Failed to delete membership plan:', error);
    return res.status(500).json({ message: 'Failed to delete membership plan', error: error.message });
  }
});


// ==========================================
// FACILITY MANAGEMENT
// ==========================================
// GET /facilities - Fetch all facilities matching your schema
router.get('/facilities', async (req: Request, res: Response) => {
  try {
    const facilities = await prisma.facility.findMany({
      select: {
        id: true,
        name: true,
        icon: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return res.json(facilities);
  } catch (error: any) {
    console.error('Error fetching facilities:', error);
    return res.status(500).json({
      message: 'Failed to fetch facilities from the database.',
      error: error.message,
    });
  }
});



/**
 * GET /admin/finance/overview
 * Fetch high-level platform revenue, tax, and refund metrics
 */
router.get('/finance/overview', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const metrics = await getFinancialOverview(start, end);
    res.json(metrics);
  } catch (error: any) {
    console.error('Error fetching financial overview:', error);
    res.status(500).json({ message: 'Failed to fetch financial metrics', error: error.message });
  }
});

/**
 * GET /admin/finance/ledger
 * Paginated list of transactions with status and purpose filtering
 */
router.get('/finance/ledger', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as any;
    const purpose = req.query.purpose as any;

    const ledger = await getTransactionLedger({ page, limit, status, purpose });
    res.json(ledger);
  } catch (error: any) {
    console.error('Error fetching ledger:', error);
    res.status(500).json({ message: 'Failed to fetch transaction ledger', error: error.message });
  }
});

// ==========================================
// 2. REFUND PROCESSING ENDPOINTS
// ==========================================

/**
 * POST /admin/finance/refunds/process
 * Approve or Reject a user-requested refund
 */
router.post('/finance/refunds/process', async (req: Request, res: Response) => {
  try {
    const { refundId, action, rejectionReason, gatewayRefundId } = req.body;
    // Assuming authenticated admin ID is attached to req.user by auth middleware
    const adminUserId = (req as any).user?.id || 'admin-system-id';

    if (!refundId || !['APPROVE', 'REJECT'].includes(action)) {
      return res.status(400).json({ message: 'Invalid payload. refundId and valid action are required.' });
    }

    const result = await processAdminRefund({
      refundId,
      adminUserId,
      action,
      rejectionReason,
      gatewayRefundId,
    });

    res.json({ message: `Refund successfully ${action.toLowerCase()}d`, data: result });
  } catch (error: any) {
    console.error('Error processing refund:', error);
    res.status(400).json({ message: error.message });
  }
});

/**
 * GET /admin/finance/bookings/:bookingId/refund-preview
 * Calculate expected refund amount based on active cancellation policies
 */
router.get('/finance/bookings/:bookingId/refund-preview', async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;

    if (typeof bookingId !== 'string' || !bookingId) {
      return res.status(400).json({ message: 'Invalid or missing booking ID' });
    }

    const preview = await calculateRefundAmount(bookingId);
    res.json(preview);
  } catch (error: any) {
    console.error('Error calculating refund preview:', error);
    res.status(500).json({ message: 'Failed to calculate refund preview', error: error.message });
  }
});

// ==========================================
// 3. CANCELLATION POLICY MANAGEMENT
// ==========================================

/**
 * POST /admin/finance/policies
 * Create a global or space-specific cancellation policy
 */
router.post('/finance/policies', async (req: Request, res: Response) => {
  try {
    const { spaceId, appliesTo, hoursBeforeStart, refundPercentage } = req.body;

    if (!appliesTo || hoursBeforeStart === undefined || refundPercentage === undefined) {
      return res.status(400).json({ message: 'Missing required policy fields.' });
    }

    const policy = await createCancellationPolicy({
      spaceId,
      appliesTo,
      hoursBeforeStart: Number(hoursBeforeStart),
      refundPercentage: Number(refundPercentage),
    });

    res.status(201).json({ message: 'Cancellation policy created', data: policy });
  } catch (error: any) {
    console.error('Error creating policy:', error);
    res.status(400).json({ message: error.message });
  }
});


// GET all cancellation policies
router.get('/finance/policies', async (req: Request, res: Response) => {
  try {
    const policies = await getCancellationPolicies();
    res.json({ data: policies });
  } catch (error: any) {
    console.error('Error fetching policies:', error);
    res.status(500).json({ message: 'Failed to fetch cancellation policies', error: error.message });
  }
});

// POST /admin/finance/policies (Create policy)
router.post('/finance/policies', async (req: Request, res: Response) => {
  try {
    const { spaceId, appliesTo, hoursBeforeStart, refundPercentage } = req.body;

    if (!appliesTo || hoursBeforeStart === undefined || refundPercentage === undefined) {
      return res.status(400).json({ message: 'Missing required policy fields.' });
    }

    const policy = await createCancellationPolicy({
      spaceId,
      appliesTo,
      hoursBeforeStart,
      refundPercentage,
    });

    res.status(201).json({ message: 'Cancellation policy created', data: policy });
  } catch (error: any) {
    console.error('Error creating policy:', error);
    res.status(400).json({ message: error.message });
  }
});

// DELETE /admin/finance/policies/:id (Delete policy)
router.delete('/finance/policies/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (typeof id !== 'string' || !id) {
      return res.status(400).json({ message: 'Invalid or missing policy ID' });
    }

    await deleteCancellationPolicy(id);
    res.json({ message: 'Cancellation policy deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting policy:', error);
    res.status(400).json({ message: error.message || 'Failed to delete policy' });
  }
});


// GET /admin/finance/policies
router.get('/finance/policies', async (req: Request, res: Response) => {
  try {
    const policies = await getCancellationPolicies();
    res.json({ data: policies });
  } catch (error: any) {
    console.error('Error fetching policies:', error);
    res.status(500).json({ message: 'Failed to fetch cancellation policies', error: error.message });
  }
});


/**
 * Fetch all user refund requests with status 'REQUESTED'
 */// GET /admin/finance/refunds/pending
router.get('/finance/refunds/pending', async (req: Request, res: Response) => {
  try {
    const pendingRefunds = await prisma.refund.findMany({
      where: {
        status: 'REQUESTED',
      },
      include: {
        payment: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ data: pendingRefunds });
  } catch (error: any) {
    console.error('Error fetching pending refunds:', error);
    res.status(500).json({ message: 'Failed to fetch pending refunds', error: error.message });
  }
});


// GET /admin/offers - Fetch all promo codes
router.get('/offers', async (req: Request, res: Response) => {
  try {
    const offers = await getAllOffers();
    res.json({ data: offers });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch offers', error: error.message });
  }
});

// GET /admin/offers - Fetch all offers with linked plans
router.get('/offers', async (req: Request, res: Response) => {
  try {
    const offers = await getAllOffers();
    res.json({ data: offers });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch offers', error: error.message });
  }
});

// POST /admin/offers - Create new offer (Common or Plan-specific)
router.post('/offers', async (req: Request, res: Response) => {
  try {
    const { code, type, value, validFrom, validTo, usageLimit, planId } = req.body;

    if (!code || !type || value === undefined || !validFrom || !validTo) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    const payload: CreateOfferInput = {
      code,
      type,
      value: Number(value),
      validFrom: new Date(validFrom),
      validTo: new Date(validTo),
      ...(usageLimit !== undefined && usageLimit !== null && usageLimit !== ''
        ? { usageLimit: Number(usageLimit) }
        : {}),
      ...(planId ? { planId: String(planId) } : {}),
    };

    const offer = await createOffer(payload);

    res.status(201).json({ message: 'Promo code created successfully', data: offer });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /admin/offers/:id
router.delete('/offers/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (typeof id !== 'string' || !id) {
      return res.status(400).json({ message: 'Valid offer ID is required.' });
    }

    await deleteOffer(id);
    res.json({ message: 'Promo code deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// POST /admin/offers/validate - Validate offer at checkout
router.post('/offers/validate', async (req: Request, res: Response) => {
  try {
    const { code, amount, planId } = req.body;
    if (!code || amount === undefined) {
      return res.status(400).json({ message: 'Code and amount are required.' });
    }

    const result = await validateAndApplyOffer(code, Number(amount), planId);
    res.json({ data: result });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// ==========================================
// Privacy & GDPR Routes
// ==========================================
router.get('/privacy/deletions', async (req: Request, res: Response) => {
  try {
    const list = await getPendingDeletions();
    res.json({ data: list });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/privacy/deletions/:id/process', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    if (!id) return res.status(400).json({ message: 'Valid user ID is required.' });

    const updatedUser = await processUserDeletion(id);
    res.json({ message: 'Account processed and anonymized.', data: updatedUser });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/privacy/terms', async (req: Request, res: Response) => {
  try {
    const active = await getActiveConsentVersion();
    res.json({ data: active });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/privacy/terms', async (req: Request, res: Response) => {
  try {
    const { version, title, content } = req.body;
    if (!version || !title) {
      return res.status(400).json({ message: 'Version and title are required.' });
    }

    const newVersion = await bumpConsentVersion(version, title, content);
    res.status(201).json({ message: 'New terms version activated.', data: newVersion });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});




// GET /api/admin/moderation/reviews
router.get('/moderation/reviews', async (req: Request, res: Response) => {
  try {
    const filter = (req.query.filter as 'all' | 'hidden' | 'low_rating') || 'all';
    const reviews = await getModerationQueue(filter);
    return res.json({ data: reviews });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to fetch moderation queue', error: error.message });
  }
});

// PATCH /api/admin/moderation/reviews/:id/visibility
router.patch('/moderation/reviews/:id/visibility', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { isHidden } = req.body;

    if (typeof isHidden !== 'boolean') {
      return res.status(400).json({ message: 'isHidden boolean parameter is required' });
    }

    const updated = await toggleReviewVisibility(id, isHidden);
    return res.json({
      message: `Review ${isHidden ? 'hidden' : 'restored'} successfully`,
      data: updated,
    });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
});

// GET /api/admin/moderation/alerts
router.get('/moderation/alerts', async (req: Request, res: Response) => {
  try {
    const alerts = await getRatingAnomalyAlerts();
    return res.json({ data: alerts });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to generate rating anomaly alerts', error: error.message });
  }
});



router.get('/tickets', async (req: Request, res: Response) => {
  try {
    const { priority, status, assignedTo } = req.query;
    const tickets = await getTickets({
      priority: priority as any,
      status: status as any,
      assignedTo: assignedTo as string,
    });
    return res.json({ data: tickets });
  } catch (error: any) {
    console.error('Error fetching tickets:', error); // Prints exact Prisma failure
    return res.status(500).json({ message: 'Failed to fetch tickets', error: error.message });
  }
});


// GET /api/admin/tickets/:id
router.get('/tickets/:id', async (req: Request, res: Response) => {
  try {
    const ticket = await getTicketDetails(req.params.id as string);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    return res.json({ data: ticket });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to fetch ticket details', error: error.message });
  }
});

// PATCH /api/admin/tickets/:id/reassign
router.patch('/tickets/:id/reassign', async (req: Request, res: Response) => {
  try {
    const { assignedTo } = req.body;
    const updated = await reassignTicket(req.params.id as string, assignedTo || null);
    return res.json({ message: 'Ticket reassigned successfully', data: updated });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
});

// PATCH /api/admin/tickets/:id/status
router.patch('/tickets/:id/status', async (req: Request, res: Response) => {
  try {
    const { status, priority } = req.body;
    const updated = await updateTicketMetadata(req.params.id as string, { status, priority });
    return res.json({ message: 'Ticket updated', data: updated });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
});

// POST /api/admin/tickets/:id/messages
router.post('/tickets/:id/messages', async (req: Request, res: Response) => {
  try {
    const { senderId, message, isInternal } = req.body;
    if (!message || !senderId) {
      return res.status(400).json({ message: 'senderId and message are required' });
    }

    const newMessage = await addTicketMessage(
      req.params.id as string,
      senderId,
      message,
      Boolean(isInternal)
    );
    return res.status(201).json({ data: newMessage });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
});



router.get('/audit-logs', async (req: Request, res: Response) => {
  try {
    const filters: AuditFilterOptions = {
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 20,
    };

    if (typeof req.query.search === 'string') filters.search = req.query.search;
    if (typeof req.query.action === 'string') filters.action = req.query.action;
    if (typeof req.query.entityType === 'string') filters.entityType = req.query.entityType;
    if (typeof req.query.actorId === 'string') filters.actorId = req.query.actorId;

    const data = await getAuditLogs(filters);
    return res.json(data);
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to fetch audit logs', error: error.message });
  }
});


router.get('/audit-logs/actor/:actorId', async (req: Request, res: Response) => {
  try {
    const actorId = typeof req.params.actorId === 'string' ? req.params.actorId : undefined;
    
    if (!actorId) {
      return res.status(400).json({ message: 'Valid actorId parameter is required' });
    }

    const logs = await getActorTraceability(actorId);
    return res.json({ logs });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to fetch actor trace', error: error.message });
  }
});






router.post('/broadcasts', async (req: Request, res: Response) => {
  try {
    const { title, message, type, targetRole, spaceId } = req.body;

    if (!title || !message || !type) {
      return res.status(400).json({ message: 'Title, message, and type are required fields.' });
    }

    const result = await createBroadcastNotification({
      title,
      message,
      type,
      targetRole,
      spaceId: type === 'LOCATION_NOTICE' ? spaceId : undefined,
    });

    return res.status(201).json({
      message: 'Broadcast notification dispatched successfully.',
      data: result,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to dispatch broadcast', error: error.message });
  }
});

router.get('/broadcasts', async (req: Request, res: Response) => {
  try {
    const broadcasts = await getBroadcastHistory();
    return res.json({ broadcasts });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to fetch broadcast history', error: error.message });
  }
});

export default router;