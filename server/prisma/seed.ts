import { PrismaClient } from '@prisma/client';
import { ObjectId } from 'bson';

const prisma = new PrismaClient();
const testUserId = new ObjectId().toHexString();

async function main() {
  // 1. Create or update the test user
  const user = await prisma.user.upsert({
    where: { id: testUserId },
    update: {},
    create: {
      //id: 'test-user-123',
      id: testUserId,
      displayName: 'Test User',
      preferences: {},
    },
  });

  // 2. Create a receipt based on the real factura.pdf
  const receipt = await prisma.receipt.create({
    data: {
      userId: user.id,
      purchaseDate: new Date('2025-01-31'),
      imageUrl: '/receipts/factura.pdf',
      originalRawText: 'Daawat Reis lose\nMond. Speisestärke\nKLC Salz Flutes\nK-St-PizzaSchinken\nKVEG Pizza Margherita\nKBB Lachsfilet\nBananenchips\nChipsfrisch Zaziki\nEier\nKerrygold Schmalz\nDanone Actimel Drink\nKLC rote Linsen\nKLC Weizenmehl\nOreo Tiramisu\nBio Zwiebeln\nMinze XXL',
      totalAmount: 72.49,
      currency: 'EUR',
      status: 'verified',
      nutritionSummary: {
        nutritionScore: 68,
        freshFoodsPercentage: 35,
        highSugarItemsPercentage: 25,
        processedFoodPercentage: 20,
        goodNutriScorePercentage: 30,
      },
    },
  });

  // 3. Create real items extracted from factura.pdf
  await prisma.item.createMany({
    data: [
      { receiptId: receipt.id, originalBillLabel: 'Daawat Reis lose', aiSuggestedName: 'Loose Rice', price: 2.99, isFoodItem: true, classification: 'Fresh Food' },
      { receiptId: receipt.id, originalBillLabel: 'Mond. Speisestärke', aiSuggestedName: 'Cornstarch', price: 1.69, isFoodItem: true, classification: 'Processed' },
      { receiptId: receipt.id, originalBillLabel: 'KLC Salz Flutes', aiSuggestedName: 'Salted Breadsticks', price: 1.59, isFoodItem: true, classification: 'Processed' },
      { receiptId: receipt.id, originalBillLabel: 'K-St-PizzaSchinken', aiSuggestedName: 'Pizza Ham', price: 3.59, isFoodItem: true, classification: 'Processed' },
      { receiptId: receipt.id, originalBillLabel: 'KVEG Pizza Margherita', aiSuggestedName: 'Frozen Pizza', price: 1.19, isFoodItem: true, classification: 'Processed' },
      { receiptId: receipt.id, originalBillLabel: 'KBB Lachsfilet', aiSuggestedName: 'Salmon Fillet', price: 9.99, isFoodItem: true, classification: 'Good Nutri-Score' },
      { receiptId: receipt.id, originalBillLabel: 'Bananenchips', aiSuggestedName: 'Banana Chips', price: 1.69, isFoodItem: true, classification: 'High Sugar' },
      { receiptId: receipt.id, originalBillLabel: 'Chipsfrisch Zaziki', aiSuggestedName: 'Tzatziki Chips', price: 1.00, isFoodItem: true, classification: 'High Sugar' },
      { receiptId: receipt.id, originalBillLabel: 'Eier', aiSuggestedName: 'Eggs', price: 1.99, isFoodItem: true, classification: 'Fresh Food' },
      { receiptId: receipt.id, originalBillLabel: 'Kerrygold Schmalz', aiSuggestedName: 'Butter Fat', price: 5.99, isFoodItem: true, classification: 'Processed' },
      { receiptId: receipt.id, originalBillLabel: 'Danone Actimel Drink', aiSuggestedName: 'Probiotic Drink', price: 2.22, isFoodItem: true, classification: 'Good Nutri-Score' },
      { receiptId: receipt.id, originalBillLabel: 'KLC rote Linsen', aiSuggestedName: 'Red Lentils', price: 1.39, isFoodItem: true, classification: 'Good Nutri-Score' },
      { receiptId: receipt.id, originalBillLabel: 'KLC Weizenmehl', aiSuggestedName: 'Wheat Flour', price: 0.59, isFoodItem: true, classification: 'Fresh Food' },
      { receiptId: receipt.id, originalBillLabel: 'Oreo Tiramisu', aiSuggestedName: 'Oreo Dessert', price: 1.29, isFoodItem: true, classification: 'High Sugar' },
      { receiptId: receipt.id, originalBillLabel: 'Bio Zwiebeln 1kg', aiSuggestedName: 'Organic Onions', price: 2.49, isFoodItem: true, classification: 'Fresh Food' },
      { receiptId: receipt.id, originalBillLabel: 'Minze XXL', aiSuggestedName: 'Mint', price: 1.99, isFoodItem: true, classification: 'Fresh Food' },
    ],
  });

  console.log('Seed created successfully with real factura data.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    // @ts-expect-error to ingore type error in process
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
