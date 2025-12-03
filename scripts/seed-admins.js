import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const a1 = process.env.ADMIN1_EMAIL;
  const p1 = process.env.ADMIN1_PASS;
  const a2 = process.env.ADMIN2_EMAIL;
  const p2 = process.env.ADMIN2_PASS;
  if (!a1 || !p1 || !a2 || !p2) {
    console.error('Please set ADMIN1_EMAIL, ADMIN1_PASS, ADMIN2_EMAIL, ADMIN2_PASS env vars');
    process.exit(1);
  }

  const hash1 = await bcrypt.hash(p1, 10);
  const hash2 = await bcrypt.hash(p2, 10);

  await prisma.adminUser.upsert({
    where: { email: a1 },
    update: { password: hash1, role: 'editor' },
    create: { email: a1, password: hash1, role: 'editor' },
  });

  await prisma.adminUser.upsert({
    where: { email: a2 },
    update: { password: hash2, role: 'editor' },
    create: { email: a2, password: hash2, role: 'editor' },
  });

  console.log('Seeded admin users');
}

await main().catch((err) => {
  console.error(err);
  process.exit(1);
}).finally(() => prisma.$disconnect());
