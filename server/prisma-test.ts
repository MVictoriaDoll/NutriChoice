import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const receipts = await prisma.receipt.findMany();
  console.log('🧾 Receipts encontrados:', receipts);
}

main()
  .catch((e) => console.error('❌ Error:', e))
  .finally(async () => {
    await prisma.$disconnect();
  });
