import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';

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
        managers: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(spaces);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch spaces', error: error.message });
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
    ] = await Promise.all([
      prisma.space.count(),
      prisma.space.count({ where: { status: 'ACTIVE' } }),
      prisma.location.count(),
      prisma.user.count({ where: { role: 'SPACE_MANAGER' } }),
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.user.count({ where: { role: 'USER', isEmailVerified: true } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({ where: { role: 'USER', isEmailVerified: false } }),
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
    });
  } catch (error: any) {
    console.error('Error fetching admin statistics:', error);
    res.status(500).json({ message: 'Failed to fetch admin statistics', error: error.message });
  }
});

export default router;