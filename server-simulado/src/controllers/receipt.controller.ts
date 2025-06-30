import { Request, Response, NextFunction, RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const uploadSimulated = async (req: Request, res: Response) => {
  const userId = req.header('X-User-Id');

  if (!userId) {
    return res.status(400).json({ message: 'Missing user ID' });
  }

  try {
    const receipt = await prisma.receipt.findFirst({
      where: { userId },
      orderBy: { purchaseDate: 'desc' },
    });

    if (!receipt) {
      return res.status(404).json({ message: 'No seed receipt found for this user' });
    }

    res.status(200).json({ receiptId: receipt.id });
  } catch (error) {
    console.error('uploadSimulated error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getReceiptById = async (req: Request, res: Response) => {
  const { receiptId } = req.params;
  const userId = req.header('X-User-Id');

  if (!userId) {
    return res.status(401).json({ message: 'Missing user ID' });
  }

  try {
    const receipt = await prisma.receipt.findUnique({
      where: { id: receiptId },
      include: { items: true },
    });

    if (!receipt || receipt.userId !== userId) {
      return res.status(404).json({ message: 'Receipt not found or unauthorized' });
    }

    res.json(receipt);
  } catch (error) {
    console.error('getReceiptById error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllReceipts = async (req: Request, res: Response) => {
  const userId = req.header('X-User-Id');

  if (!userId) {
    return res.status(401).json({ message: 'Missing user ID' });
  }

  try {
    const receipts = await prisma.receipt.findMany({
      where: { userId },
      include: { items: true },
    });

    res.json(receipts);
  } catch (error) {
    console.error('getAllReceipts error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const verifyAndFinalizeReceipt: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { receiptId } = req.params;
  const userId = req.header('X-User-Id');
  const { nutritionSummary, aiFeedbackReceipt, items } = req.body;

  if (!userId) {
    return res.status(401).json({ message: 'Missing user ID' });
  }

  try {
    const updatedReceipt = await prisma.receipt.update({
      where: { id: receiptId },
      data: {
        nutritionSummary,
        aiFeedbackReceipt,
        items: {
          deleteMany: {}, // borra items previos
          create: items.map((item: any) => ({
            originalBillLabel: item.originalBillLabel,
            aiSuggestedName: item.aiSuggestedName,
            price: item.price,
            isFoodItem: item.isFoodItem,
            classification: item.classification,
          }))
        },
      },
      include: { items: true },
    });

    res.json({ message: 'Receipt verified and finalized.', receipt: updatedReceipt });
  } catch (error) {
    console.error('Error finalizing receipt:', error);
    res.status(500).json({ message: 'Internal server error' });
  }

  
};
export const getAnalysisSummary = async (req: Request, res: Response) => {
  const userId = req.header('X-User-Id');

  if (!userId) {
    return res.status(401).json({ message: 'Missing user ID' });
  }

  try {
    const summary = await prisma.userNutritionSummary.findUnique({
      where: { userId },
    });

    if (!summary) {
      return res.status(404).json({ message: 'No nutrition summary found' });
    }

    res.json(summary);
  } catch (error) {
    console.error('getAnalysisSummary error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


export const getFeedback = async (req: Request, res: Response) => {
  const userId = req.header('X-User-Id');

  if (!userId) {
    return res.status(401).json({ message: 'Missing user ID' });
  }

  try {
    const groceryList = await prisma.groceryList.findUnique({
      where: { userId },
    });

    if (!groceryList) {
      return res.status(404).json({ message: 'No grocery list found' });
    }

    res.json(groceryList);
  } catch (error) {
    console.error('getFeedback error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

