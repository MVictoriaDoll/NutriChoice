import { PrismaClient, Prisma } from '@prisma/client';
import { AIReceiptData } from './ai.service';

const prisma = new PrismaClient();

export const receiptService = {
  createReceiptAndProcessData: async (
    userId: string,
    fileOriginalName: string,
    parsedReceiptData: AIReceiptData
  ) => {
    const dbUserId = userId; // ya lo tenés plano, sin split

    const newReceipt = await prisma.$transaction(async (tx) => {
      // Calcular resumen nutricional
      const foodItems = parsedReceiptData.items.filter((item) => item.isFoodItem);
      const foodItemCount = foodItems.length;

      let nutritionSummary = {
        calculatedScore: 0,
        freshFoods: 0,
        highSugarItems: 0,
        processedFood: 0,
        goodNutriScore: 0,
      };

      if (foodItemCount > 0) {
        foodItems.forEach((item) => {
          switch (item.classification) {
            case 'Fresh Food':       nutritionSummary.freshFoods++; break;
            case 'High Sugar':       nutritionSummary.highSugarItems++; break;
            case 'Processed':        nutritionSummary.processedFood++; break;
            case 'Good Nutri-Score': nutritionSummary.goodNutriScore++; break;
          }
        });

        nutritionSummary.freshFoods     = (nutritionSummary.freshFoods / foodItemCount) * 100;
        nutritionSummary.highSugarItems = (nutritionSummary.highSugarItems / foodItemCount) * 100;
        nutritionSummary.processedFood  = (nutritionSummary.processedFood / foodItemCount) * 100;
        nutritionSummary.goodNutriScore = (nutritionSummary.goodNutriScore / foodItemCount) * 100;
        nutritionSummary.calculatedScore =
          nutritionSummary.freshFoods + nutritionSummary.goodNutriScore -
          (nutritionSummary.highSugarItems + nutritionSummary.processedFood);
      }

      const receipt = await tx.receipt.create({
        data: {
          purchaseDate: parsedReceiptData.purchaseDate ? new Date(parsedReceiptData.purchaseDate) : new Date(),
          imageUrl: fileOriginalName,
          originalRawText: parsedReceiptData.originalRawText || '',
          totalAmount: parsedReceiptData.totalAmount ?? 0,
          currency: parsedReceiptData.currency || 'EUR',
          status: 'processed',
          userId: dbUserId,
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

        await tx.item.createMany({ data: itemsToCreate });
      }

      return receipt;
    });

    return newReceipt;
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

    const updatedReceipt = await prisma.$transaction(async (tx) => {
      const receipt = await tx.receipt.update({
        where: { id: receiptId },
        data: {
          nutritionSummary: data.nutritionSummary as Prisma.InputJsonValue,
          aiFeedbackReceipt: data.aiFeedbackReceipt || undefined,
          status: 'verified',
        },
      });

      await tx.item.deleteMany({ where: { receiptId } });

      const itemsToCreate = data.items.map((item) => ({
        originalBillLabel: item.originalBillLabel || '',
        aiSuggestedName: item.aiSuggestedName || '',
        price: item.price ?? 0,
        isFoodItem: !!item.isFoodItem,
        nutritionDetails: item.nutritionDetails as Prisma.InputJsonValue,
        classification: item.classification || 'Other',
        manualCorrection: true,
        receiptId: receipt.id,
      }));

      await tx.item.createMany({ data: itemsToCreate });

      return receipt;
    });

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
};
