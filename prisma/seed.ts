import bcrypt from 'bcryptjs';
import pkg from '@prisma/client';

const { PrismaClient, Role } = pkg;

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be provided for seeding.');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      password: passwordHash,
      role: Role.ADMIN,
    },
    create: {
      email,
      password: passwordHash,
      role: Role.ADMIN,
    },
  });

  console.log(`Seeded admin user with email ${admin.email}`);
}

main()
  .catch((error) => {
    console.error('Seed failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
