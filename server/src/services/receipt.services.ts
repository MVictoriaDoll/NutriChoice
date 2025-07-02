import { PrismaClient, Prisma } from '@prisma/client';
import { AIReceiptData } from './ai.service';

const prisma = new PrismaClient();

export const receiptService = {
  createReceiptAndProcessData: async (
    userId: string,
    fileOriginalName: string,
    parsedReceiptData: AIReceiptData
  ) => {
    const foodItems = parsedReceiptData.items.filter((item) => item.isFoodItem);
    const foodItemCount = foodItems.length;

    const nutritionSummary = {
      calculatedScore: 0,
      freshFoods: 0,
      highSugarItems: 0,
      processedFood: 0,
      goodNutriScore: 0,
    };

    if (foodItemCount > 0) {
      foodItems.forEach((item) => {
        switch (item.classification) {
          case 'Fresh Food':
            nutritionSummary.freshFoods++;
            break;
          case 'High Sugar':
            nutritionSummary.highSugarItems++;
            break;
          case 'Processed':
            nutritionSummary.processedFood++;
            break;
          case 'Good Nutri-Score':
            nutritionSummary.goodNutriScore++;
            break;
        }
      });

      nutritionSummary.freshFoods = (nutritionSummary.freshFoods / foodItemCount) * 100;
      nutritionSummary.highSugarItems = (nutritionSummary.highSugarItems / foodItemCount) * 100;
      nutritionSummary.processedFood = (nutritionSummary.processedFood / foodItemCount) * 100;
      nutritionSummary.goodNutriScore = (nutritionSummary.goodNutriScore / foodItemCount) * 100;

      nutritionSummary.calculatedScore =
        nutritionSummary.freshFoods +
        nutritionSummary.goodNutriScore -
        (nutritionSummary.highSugarItems + nutritionSummary.processedFood);
    }

    const receipt = await prisma.receipt.create({
      data: {
        purchaseDate: parsedReceiptData.purchaseDate ? new Date(parsedReceiptData.purchaseDate) : new Date(),
        imageUrl: fileOriginalName,
        originalRawText: parsedReceiptData.originalRawText || '',
        totalAmount: parsedReceiptData.totalAmount ?? 0,
        currency: parsedReceiptData.currency || 'EUR',
        status: 'processed',
        userId,
        nutritionSummary: nutritionSummary as Prisma.InputJsonValue,
        aiFeedbackReceipt: 'Initial AI analysis complete. Verify items',
      },
    });

    if (parsedReceiptData.items.length > 0) {
      const itemsToCreate = parsedReceiptData.items.map((item) => ({
        originalBillLabel: item.originalBillLabel || '',
        aiSuggestedName: item.aiSuggestedName || '',
        price: item.price ?? 0,
        isFoodItem: !!item.isFoodItem,
        nutritionDetails: item.nutritionDetails as Prisma.InputJsonValue,
        classification: item.classification || 'Other',
        manualCorrection: false,
        receiptId: receipt.id,
      }));

      await prisma.item.createMany({ data: itemsToCreate });
    }

    return receipt;
  },

  updateReceiptAfterVerification: async (
    receiptId: string,
    userId: string,
    data: {
      nutritionSummary: any;
      aiFeedbackReceipt: string;
      items: AIReceiptData['items'];
    }
  ) => {
    const dbUserId = userId;

    const existing = await prisma.receipt.findFirst({
      where: { id: receiptId, userId: dbUserId },
    });

    if (!existing) {
      throw new Error('Receipt not found or unauthorized');
    }

    const updatedReceipt = await prisma.receipt.update({
      where: { id: receiptId },
      data: {
        nutritionSummary: data.nutritionSummary as Prisma.InputJsonValue,
        aiFeedbackReceipt: data.aiFeedbackReceipt || undefined,
        status: 'verified',
      },
    });

    await prisma.item.deleteMany({ where: { receiptId } });

    const itemsToCreate = data.items.map((item) => ({
      originalBillLabel: item.originalBillLabel || '',
      aiSuggestedName: item.aiSuggestedName || '',
      price: item.price ?? 0,
      isFoodItem: !!item.isFoodItem,
      nutritionDetails: item.nutritionDetails as Prisma.InputJsonValue,
      classification: item.classification || 'Other',
      manualCorrection: true,
      receiptId: updatedReceipt.id,
    }));

    await prisma.item.createMany({ data: itemsToCreate });

    await receiptService._processAndAggregateUserNutrition(prisma, dbUserId);

    return updatedReceipt;
  },

  getReceiptById: async (receiptId: string, userId: string) => {
    const receipt = await prisma.receipt.findUnique({
      where: { id: receiptId },
      include: { items: true },
    });
    return receipt?.userId === userId ? receipt : null;
  },

  getAllReceipts: async (userId: string) => {
    return await prisma.receipt.findMany({
      where: { userId },
      orderBy: { purchaseDate: 'desc' },
    });
  },

  getUserNutritionSummary: async (userId: string) => {
    const dbUserId = userId;

    return await prisma.userNutritionSummary.findUnique({
      where: { userId},
    });
  },

  _processAndAggregateUserNutrition: async (
    prismaTx: Prisma.TransactionClient,
    dbUserId: string
  ) => {
    const allRelevant = await prismaTx.receipt.findMany({
      where: { userId: dbUserId, status: { in: ['processed', 'verified'] } },
      select: { nutritionSummary: true },
    });

    console.log('[ Generando resumen para]', dbUserId);

    let totalScore = 0,
      totalFresh = 0,
      totalHigh = 0,
      totalProc = 0,
      totalGood = 0,
      count = 0;

    allRelevant.forEach((r) => {
      const s = r.nutritionSummary as any;
      if (s && typeof s === 'object') {
        totalScore += s.calculatedScore ?? 0;
        totalFresh += s.freshFoods ?? 0;
        totalHigh += s.highSugarItems ?? 0;
        totalProc += s.processedFood ?? 0;
        totalGood += s.goodNutriScore ?? 0;
        count++;
      }
    });

    const avg = (val: number) => (count ? val / count : 0);

    let overallAiFeedback = 'Keep up the good work on your groceries!';
    if (avg(totalProc) > 30) overallAiFeedback = 'Consider reducing processed food in your purchases';
    if (avg(totalFresh) < 50) overallAiFeedback = 'Focus on eating more fresh foods';
    if (avg(totalHigh) > 20) overallAiFeedback = 'Watch out for high-sugar items; try healthier alternatives!';

    await prismaTx.userNutritionSummary.upsert({
      where: { userId: dbUserId },
      update: {
        nutritionScore: avg(totalScore),
        freshFoodsPercentage: avg(totalFresh),
        highSugarItemsPercentage: avg(totalHigh),
        processedFoodPercentage: avg(totalProc),
        goodNutriScorePercentage: avg(totalGood),
        overallAiFeedback,
      },
      create: {
        userId: dbUserId,
        nutritionScore: avg(totalScore),
        freshFoodsPercentage: avg(totalFresh),
        highSugarItemsPercentage: avg(totalHigh),
        processedFoodPercentage: avg(totalProc),
        goodNutriScorePercentage: avg(totalGood),
        overallAiFeedback,
      },
    });

    console.log('[✅ Resumen guardado correctamente]');
  }
};
