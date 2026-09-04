import { PrismaClient, UserRole } from '@prisma/client';


const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_INITIAL_EMAIL || 'akashgupta_ce_2021@ltce.in';

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'System Administrator',
      role: UserRole.ADMIN,
      isEmailVerified: true,
    },
  });

  console.log(`✅ Pre-seeded System Admin account: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });