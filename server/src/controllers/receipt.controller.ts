import { Request, Response, NextFunction, RequestHandler } from 'express';
import { aiService } from '../services/ai.service';
import { receiptService } from '../services/receipt.services';
import type { Auth0Request } from '../middleware/auth0';
import fs from 'fs/promises';
import path from 'path';

// Upload receipt page and AI to database
export const uploadReceipt: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { user: authUser } = req as Auth0Request;
  const userId = authUser?.sub;
  const imageFile = req.file;
  let tempFilePath: string | null = null;

  if (!userId) {
    console.error(
      'Error in uploadReceipt: userId is missing after authentication middleware.'
    );
    res.status(401).json({ message: 'Unauthenticated user.' });
    return;
  }

  if (!imageFile) {
    res.status(400).json({ message: 'No image file uploaded.' });
    return;
  }

  try {

    const tempDir = path.join(__dirname, '..', '..', 'temp');
    await fs.mkdir(tempDir, { recursive: true });
    tempFilePath = path.join(
      tempDir,
      `${Date.now()}-${imageFile.originalname}`
    );
    await fs.writeFile(tempFilePath, imageFile.buffer);


    console.log(`Starting AI receipt processing for user ${userId}...`);
    const parsedReceiptData = await aiService.processReceipt(tempFilePath);
    console.log(`AI processing complete for user ${userId}.`);


    const newReceipt = await receiptService.createReceiptAndProcessData(
      userId,
      imageFile.originalname,
      parsedReceiptData
    );

    res
      .status(201)
      .json({
        message: 'Receipt uploaded and processed successfully.',
        receipt: newReceipt,
      });
    return;
  } catch (error) {
    console.error(`Error during AI processing for user ${userId}: `, error);

    if (error instanceof Error) {
      switch (error.message) {
        case 'PDF_PARSING_FAILED':
          res
            .status(422)
            .json({ message: 'Could not read the provided PDF file.' });
          return;
        case 'AI_VALIDATION_FAILED':
          res.status(422).json({
            message:
              'The uploaded document does not appear to be a grocery receipt.',
          });
          return;
        case 'AI_JSON_STRUCTURE_FAILED':
          res.status(500).json({
            message:
              'Failed to analyze the receipt text. Please try again.',
          });
          return;
      }
    }

    next(error);
    return;
  } finally {

    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath);
        console.log(`Successfully deleted temporary file: ${tempFilePath}`);
      } catch (cleanupError) {
        console.error(
          `Failed to delete temporary file: ${tempFilePath}`,
          cleanupError
        );
      }
    }
  }
};

// Verify document page User interaction
export const getReceiptById: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { user: authUser } = req as Auth0Request;
  const userId = authUser?.sub;
  const { receiptId } = req.params;

  if (!userId) {
    console.error('Error in getReceiptById: userId is missing.');
    res.status(401).json({ message: 'Unauthenticated user.' });
    return;
  }

  try {
    const receipt = await receiptService.getReceiptById(receiptId, userId);
    if (receipt) {
      res.json(receipt);
    } else {
      console.warn(
        `Receipt not found or unauthorized for ID: ${receiptId} by user: ${userId}`
      );
      res
        .status(404)
        .json({ message: 'Receipt not found or unauthorized access.' });
    }
    return;
  } catch (error) {
    console.error('Error fetching single receipt: ', error);
    next(error);
    return;
  }
};

// Endpoint for fetching all receipts (e.g., for calendar/shopping history)
export const getAllReceipts: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { user: authUser } = req as Auth0Request;
  const userId = authUser?.sub;

  if (!userId) {
    console.error('Error in getAllReceipts: userId is missing.');
    res.status(401).json({ message: 'Unauthenticated user.' });
    return;
  }

  try {
    const receipts = await receiptService.getAllReceipts(userId);
    res.json(receipts);
    return;
  } catch (error) {
    console.error('Error fetching all receipts: ', error);
    next(error);
    return;
  }
};

// Update summary after user verification/correction
export const verifyAndFinalizeReceipt: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { user: authUser } = req as Auth0Request;
  const userId = authUser?.sub;
  const { receiptId } = req.params;
  const {
    nutritionSummary,
    aiFeedbackReceipt,
    items: updatedItemsData,
  } = req.body;
  


  if (!userId) {
    console.error('Error in verifyAndFinalizeReceipt: userId is missing.');
    res.status(401).json({ message: 'Unauthenticated user.' });
    return;
  }

  try {
    const updatedReceipt =
      await receiptService.updateReceiptAfterVerification(
        receiptId,
        userId,
        { nutritionSummary, aiFeedbackReceipt, items: updatedItemsData }
      );

    res.json({
      message: 'Receipt verified and finalized.',
      receipt: updatedReceipt,
    });
    return;
  } catch (error) {
    console.error('Error verifying and finalizing receipt: ', error);
    next(error);
    return;
  }
};

// get summary 
export const getReceiptAnalysis: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { user: authUser } = req as Auth0Request;
  const userId = authUser?.sub;

  console.log('[Auth Header]', req.headers.authorization);
  console.log('[Auth0 userId]', userId);

  if (!userId) {
    console.warn('[Warning] Missing userId from token');
    res.status(401).json({ message: 'User not authenticated' });
    return;
  }

  try {
    const summary = await receiptService.getUserNutritionSummary(userId);
    console.log('[ summary encontrado]', summary);

    if (!summary) {
      console.warn('[No summary found for user]', userId);
      res.status(404).json({ message: 'Nutrition summary not found' });
      return;
    }

    console.log('[Nutrition Summary]', summary);
    res.json(summary);
  } catch (error) {
    console.error('Error in getReceiptAnalysis:', error);
    next(error);
  }
};
