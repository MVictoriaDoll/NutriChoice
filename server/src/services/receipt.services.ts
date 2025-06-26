import { PrismaClient, Prisma } from '@prisma/client';
import { AIReceiptData } from './ai.service';

const prisma = new PrismaClient();

interface ReceiptNutritionSummaryJson extends Record<string, unknown>{
  calculatedScore: number;
  freshFoods: number;
  highSugarItems: number;
  processedFood: number;
  goodNutriScore: number;
}

function isReceiptNutritionSummary(summary: unknown): summary is ReceiptNutritionSummaryJson {
    if (typeof summary !== 'object' || summary === null) {
        return false;
    }

    const potentialSummary = summary as Record<string, unknown>; // Cast to a record to check properties safely

    return (
        'calculatedScore' in potentialSummary && typeof potentialSummary.calculatedScore === 'number' &&
        'freshFoods' in potentialSummary && typeof potentialSummary.freshFoods === 'number' &&
        'highSugarItems' in potentialSummary && typeof potentialSummary.highSugarItems === 'number' &&
        'processedFood' in potentialSummary && typeof potentialSummary.processedFood === 'number' &&
        'goodNutriScore' in potentialSummary && typeof potentialSummary.goodNutriScore === 'number'
    );
}

export const receiptService = {

  createReceiptAndProcessData: async (
    userId: string,
    fileOriginalName: string,
    parsedReceiptData: AIReceiptData
  ) => {
    // Prisma transaction - atomicity
    const newReceipt = await prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
      const receipt = await prismaTx.receipt.create({
        data: {
          purchaseDate: parsedReceiptData.purchaseDate
            ? new Date(parsedReceiptData.purchaseDate)
            : new Date(),
          imageUrl: fileOriginalName,
          originalRawText: parsedReceiptData.originalRawText || '',
          totalAmount: parsedReceiptData.totalAmount !== null ? parsedReceiptData.totalAmount : 0,
          currency: parsedReceiptData.currency || 'EUR',
          status: 'processed', // status after AI processing
          userId: userId,
          // Basic summary (AI Generated)
          nutritionSummary: JSON.parse(JSON.stringify({
            calculatedScore: 0,
            freshFoods: 0,
            highSugarItems: 0,
            processedFood: 0,
            goodNutriScore: 0,
          })),
          aiFeedbackReceipt: 'Initial AI analysis complete. Verify items',
        },
      });

      if (parsedReceiptData.items && parsedReceiptData.items.length > 0) {
        const itemsToCreate = parsedReceiptData.items.map((item) => ({
          originalBillLabel: item.originalBillLabel || '',
          aiSuggestedName: item.aiSuggestedName || '',
          price: item.price !== null ? item.price : 0,
          isFoodItem: typeof item.isFoodItem === 'boolean' ? item.isFoodItem : false,
          nutritionDetails: item.isFoodItem ? JSON.parse(JSON.stringify(item.nutritionDetails || {})) : JSON.parse(JSON.stringify({})),
          classification: item.isFoodItem ? item.classification || 'Other' : 'Other',
          manualCorrection: false,
          receiptId: newReceipt.id,
        }));
        await prismaTx.item.createMany({ data: itemsToCreate });
      }
      await receiptService._processAndAggregateUserNutrition(prismaTx, userId);

      return receipt;
    });
    return newReceipt;
  },

  // For user verification screen
  updateReceiptAfterVerification: async (
    receiptId: string,
    userId: string,
    data: {
      nutritionSummary: ReceiptNutritionSummaryJson;
      aiFeedbackReceipt: string;
      items: AIReceiptData['items'];
    }
  ) => {
    const { nutritionSummary, aiFeedbackReceipt, items: updatedItemsData } = data;
    const updatedReceipt = await prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
      // update the contents of receipt
      const receipt = await prismaTx.receipt.update({
        where: { id: receiptId, userId: userId },
        data: {
          nutritionSummary: JSON.parse(JSON.stringify(nutritionSummary || {})),
          aiFeedbackReceipt: aiFeedbackReceipt || undefined,
          status: 'verified',
        },
      });

      await prismaTx.item.deleteMany({ where: { receiptId: receiptId } });
      if (updatedItemsData && updatedItemsData.length > 0) {
        const itemsToCreate = updatedItemsData.map((item) => ({
          originalBillLabel: item.originalBillLabel || '',
          aiSuggestedName: item.aiSuggestedName || '',
          price: item.price !== null ? item.price : 0,
          isFoodItem: typeof item.isFoodItem === 'boolean' ? item.isFoodItem : false,
          nutritionDetails: item.isFoodItem ? JSON.parse(JSON.stringify(item.nutritionDetails || {})) : JSON.parse(JSON.stringify({})),
          classification: item.isFoodItem ? item.classification || 'Other' : 'Other',
          manualCorrection: true,
          receiptId: receipt.id,
        }));
        await prismaTx.item.createMany({ data: itemsToCreate });
      }
      await receiptService._processAndAggregateUserNutrition(prismaTx, userId);

      return receipt;
    });
    return updatedReceipt;
  },


  _processAndAggregateUserNutrition: async (prismaTx: Prisma.TransactionClient, userId: string) => {
    // Aggregate based on receipts that are either 'processed' or 'verified'
    const allRelevantReceipts = await prismaTx.receipt.findMany({
      where: { userId: userId, status: { in: ['processed', 'verified'] } },
      select: { nutritionSummary: true },
    });

    let totalCalculatedScore = 0;
    let totalFreshFoods = 0;
    let totalHighSugar = 0;
    let totalProcessed = 0;
    let totalGoodNutri = 0;
    let analyzedReceiptCount = 0;

    allRelevantReceipts.forEach((receipt) => {
      if (receipt.nutritionSummary && isReceiptNutritionSummary(receipt.nutritionSummary)) {
        const summary = receipt.nutritionSummary;
        totalCalculatedScore += summary.calculatedScore || 0;
        totalFreshFoods += summary.freshFoods || 0;
        totalHighSugar += summary.highSugarItems || 0;
        totalProcessed += summary.processedFood || 0;
        totalGoodNutri += summary.goodNutriScore || 0;
        analyzedReceiptCount++;
      }
    });

    const avgNutritionScore =
      analyzedReceiptCount > 0 ? totalCalculatedScore / analyzedReceiptCount : 0;
    const avgFreshFoods = analyzedReceiptCount > 0 ? totalFreshFoods / analyzedReceiptCount : 0;
    const avgHighSugar = analyzedReceiptCount > 0 ? totalHighSugar / analyzedReceiptCount : 0;
    const avgProcessed = analyzedReceiptCount > 0 ? totalProcessed / analyzedReceiptCount : 0;
    const avgGoodNutri = analyzedReceiptCount > 0 ? totalGoodNutri / analyzedReceiptCount : 0;

    let overallAiFeedback = 'Keep up the good work on your groceries!';
    if (avgProcessed > 30)
      overallAiFeedback = 'Consider reducing processed food across your purchases';
    if (avgFreshFoods < 50)
      overallAiFeedback = 'Focus on increasing fresh food intake in your next shopping trips.';
    if (avgHighSugar > 20)
      overallAiFeedback = 'Watch out for high sugar items; try healthier alternatives!';

    await prismaTx.userNutritionSummary.upsert({
      where: { userId: userId },
      update: {
        nutritionScore: avgNutritionScore,
        freshFoodsPercentage: avgFreshFoods,
        highSugarItemsPercentage: avgHighSugar,
        processedFoodPercentage: avgProcessed,
        goodNutriScorePercentage: avgGoodNutri,
        overallAiFeedback: overallAiFeedback,
      },
      create: {
        userId: userId,
        nutritionScore: avgNutritionScore,
        freshFoodsPercentage: avgFreshFoods,
        highSugarItemsPercentage: avgHighSugar,
        processedFoodPercentage: avgProcessed,
        goodNutriScorePercentage: avgGoodNutri,
        overallAiFeedback: overallAiFeedback,
      },
    });
  },

  getReceiptById: async (receiptId: string, userId: string) => {
    return await prisma.receipt.findUnique({
      where: { id: receiptId, userId: userId },
      include: { items: true },
    });
  },

  getAllReceipts: async (userId: string) => {
    return await prisma.receipt.findMany({
      where: { userId: userId },
      orderBy: { purchaseDate: 'desc' },
    });
  },
};
