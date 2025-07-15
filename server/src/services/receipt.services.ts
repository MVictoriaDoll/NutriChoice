import { PrismaClient, Prisma } from '@prisma/client';
import { AIReceiptData } from './ai.service';

const prisma = new PrismaClient();

interface ReceiptNutritionSummaryJson extends Record<string, unknown> {
  calculatedScore: number;
  freshFoods: number;
  highSugarItems: number;
  processedFood: number;
  goodNutriScore: number;
}

function isReceiptNutritionSummary(summary: unknown): summary is ReceiptNutritionSummaryJson {
  if (typeof summary !== 'object' || summary === null) return false;
  const p = summary as Record<string, unknown>;
  return (
    'calculatedScore' in p && typeof p.calculatedScore === 'number' &&
    'freshFoods' in p && typeof p.freshFoods === 'number' &&
    'highSugarItems' in p && typeof p.highSugarItems === 'number' &&
    'processedFood' in p && typeof p.processedFood === 'number' &&
    'goodNutriScore' in p && typeof p.goodNutriScore === 'number'
  );
}

export const receiptService = {
  createReceiptAndProcessData: async (
    userId: string,
    fileOriginalName: string,
    parsedReceiptData: AIReceiptData
  ) => {

    const newReceipt = await prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
    console.log('[DEBUG] Data received for nutrition calculation:', JSON.stringify(parsedReceiptData.items, null, 2));
    const nutritionSummary: ReceiptNutritionSummaryJson = {
      calculatedScore: 0,
      freshFoods: 0,
      highSugarItems: 0,
      processedFood: 0,
      goodNutriScore: 0,
    };

    const foodItemCount = parsedReceiptData.items.filter(item => item.isFoodItem).length;
    console.log(`[DEBUG] Found ${foodItemCount} food items to analyze.`);

    if (foodItemCount > 0) {
      console.log('[DEBUG] Starting nutrition summary calculation...');
      let freshCount = 0, sugarCount = 0, processedCount = 0, goodScoreCount = 0;
      parsedReceiptData.items.forEach(item => {
        if (item.isFoodItem) {
          console.log(`[DEBUG] Processing item: ${item.aiSuggestedName}, Classification: "${item.classification}"`);
          switch (item.classification) {
            case 'Fresh Food':      freshCount++; break;
            case 'High Sugar':      sugarCount++; break;
            case 'Processed':       processedCount++; break;
            case 'Good Nutri-Score':goodScoreCount++; break;
          }
        }
      });
      nutritionSummary.freshFoods     = (freshCount  / foodItemCount) * 100;
      nutritionSummary.highSugarItems = (sugarCount  / foodItemCount) * 100;
      nutritionSummary.processedFood  = (processedCount / foodItemCount) * 100;
      nutritionSummary.goodNutriScore = (goodScoreCount / foodItemCount) * 100;
      nutritionSummary.calculatedScore =
        (nutritionSummary.freshFoods + nutritionSummary.goodNutriScore) -
        (nutritionSummary.processedFood + nutritionSummary.highSugarItems);
      console.log('[DEBUG] Final nutritionSummary:', nutritionSummary);
    }

      const receipt = await prismaTx.receipt.create({
        data: {
          purchaseDate: parsedReceiptData.purchaseDate
            ? new Date(parsedReceiptData.purchaseDate)
            : new Date(),
          imageUrl: fileOriginalName,
          originalRawText: parsedReceiptData.originalRawText || '',
          totalAmount: parsedReceiptData.totalAmount ?? 0,
          currency: parsedReceiptData.currency || 'EUR',
          status: 'processed',
          userId: userId,              // —— 改为纯 hex
          nutritionSummary: nutritionSummary as Prisma.JsonObject,
          aiFeedbackReceipt: 'Initial AI analysis complete. Verify items',
        },
      });

      if (parsedReceiptData.items.length > 0) {
        const itemsToCreate = parsedReceiptData.items.map(item => ({
          originalBillLabel: item.originalBillLabel || '',
          aiSuggestedName: item.aiSuggestedName || '',
          price: item.price ?? 0,
          isFoodItem: !!item.isFoodItem,
          nutritionDetails: item.isFoodItem
            ? (JSON.parse(JSON.stringify(item.nutritionDetails || {})) as Prisma.InputJsonValue)
            : {} as Prisma.InputJsonValue,
          classification: item.classification || 'Other',
          manualCorrection: false,
          receiptId: receipt.id,
        }));
        await prismaTx.item.createMany({ data: itemsToCreate });
      }


      await receiptService._processAndAggregateUserNutrition(prismaTx, userId);

      return receipt;
    });

    return newReceipt;
  },

  updateReceiptAfterVerification: async (
    receiptId: string,
    userId: string,
    data: {
      nutritionSummary: ReceiptNutritionSummaryJson;
      aiFeedbackReceipt: string;
      items: AIReceiptData['items'];
    }
  ) => {

    const updatedReceipt = await prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
      const existing = await prismaTx.receipt.findFirst({
        where: { id: receiptId, userId: userId },
      });
      if (!existing) {
        throw new Error('Receipt not found or unauthorized');
      }

      const receipt = await prismaTx.receipt.update({
        where: { id: receiptId },
        data: {
          nutritionSummary: JSON.parse(JSON.stringify(data.nutritionSummary)),
          aiFeedbackReceipt: data.aiFeedbackReceipt || undefined,
          status: 'verified',
        },
      });

      await prismaTx.item.deleteMany({ where: { receiptId } });
      if (data.items.length > 0) {
        const itemsToCreate = data.items.map(item => ({
          originalBillLabel: item.originalBillLabel || '',
          aiSuggestedName:   item.aiSuggestedName   || '',
          price:             item.price ?? 0,
          isFoodItem:        !!item.isFoodItem,
          nutritionDetails:  item.isFoodItem
                               ? (JSON.parse(JSON.stringify(item.nutritionDetails || {})) as Prisma.InputJsonValue)
                               : {} as Prisma.InputJsonValue,
          classification:    item.classification || 'Other',
          manualCorrection:  true,
          receiptId:         receipt.id,
        }));
        await prismaTx.item.createMany({ data: itemsToCreate });
      }

      await receiptService._processAndAggregateUserNutrition(prismaTx, userId);

      return receipt;
    });

    return updatedReceipt;
  },

  _processAndAggregateUserNutrition: async (
    prismaTx: Prisma.TransactionClient,
    userId: string
  ) => {
    const allRelevant = await prismaTx.receipt.findMany({
      where: { userId: userId, status: { in: ['processed', 'verified'] } },
      select: { nutritionSummary: true },
    });

    let totalScore = 0, totalFresh = 0, totalHigh = 0, totalProc = 0, totalGood = 0, count = 0;
    allRelevant.forEach(r => {
      if (isReceiptNutritionSummary(r.nutritionSummary)) {
        totalScore += r.nutritionSummary.calculatedScore;
        totalFresh += r.nutritionSummary.freshFoods;
        totalHigh  += r.nutritionSummary.highSugarItems;
        totalProc  += r.nutritionSummary.processedFood;
        totalGood  += r.nutritionSummary.goodNutriScore;
        count++;
      }
    });

    const avgScore = count ? totalScore / count : 0;
    const avgFresh = count ? totalFresh / count : 0;
    const avgHigh  = count ? totalHigh / count : 0;
    const avgProc  = count ? totalProc / count : 0;
    const avgGood  = count ? totalGood / count : 0;

    let overallAiFeedback = 'Keep up the good work on your groceries!';
    if (avgProc > 30) overallAiFeedback = 'Consider reducing processed food in your purchases';
    if (avgFresh < 50) overallAiFeedback = 'Focus on eating more fresh foods';
    if (avgHigh > 20) overallAiFeedback = 'Watch out for high-sugar items; try healthier alternatives!';

    await prismaTx.userNutritionSummary.upsert({
      where: { userId: userId },
      update: {
        nutritionScore:            avgScore,
        freshFoodsPercentage:      avgFresh,
        highSugarItemsPercentage:  avgHigh,
        processedFoodPercentage:   avgProc,
        goodNutriScorePercentage:  avgGood,
        overallAiFeedback,
      },
      create: {
        userId:                    userId,
        nutritionScore:            avgScore,
        freshFoodsPercentage:      avgFresh,
        highSugarItemsPercentage:  avgHigh,
        processedFoodPercentage:   avgProc,
        goodNutriScorePercentage:  avgGood,
        overallAiFeedback,
      },
    });
  },

  getReceiptById: async (receiptId: string, userId: string) => {
    const receipt = await prisma.receipt.findUnique({
      where: { id: receiptId },
      include: { items: true },
    });
    return receipt && receipt.userId === userId ? receipt : null;
  },

  getAllReceipts: async (userId: string) => {
    return await prisma.receipt.findMany({
      where: { userId: userId },
      orderBy: { purchaseDate: 'desc' },
    });
  },
};
