import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Simula la subida de una factura devolviendo un receiptId del seed.
 * No necesita archivo, AI, ni multer.
 */
export const uploadSimulated = async (req: Request, res: Response) => {
  const userId = req.header('X-User-Id');

  if (!userId) {
    res.status(400).json({ message: 'Missing user ID' });
    return;
  }

  try {
    const receipt = await prisma.receipt.findFirst({
      where: { userId },
      orderBy: { purchaseDate: 'desc' },
    });

    if (!receipt) {
      res.status(404).json({ message: 'No receipt found for this user' });
      return;
    }

    res.status(200).json({
      message: 'Simulated upload successful',
      receiptId: receipt.id,
    });
  } catch (error) {
    console.error('Upload simulation error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
