import { Request, Response, NextFunction, RequestHandler } from 'express';
import { aiService } from '../services/ai.service';
import { receiptService } from '../services/receipt.services';
import fs from 'fs/promises';
import path from 'path';

// Upload receipt page and AI to database
export const uploadReceipt: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  console.log("uploadReceipt handler triggered");
  const userId = req.userId;
  const imageFile = req.file;
  let tempFilePath: string | null = null; // Variable to hold the temp file path

  if (!userId) {
    console.error('Error in uploadReceipt: userId is missing after authentication middleware.');
    res.status(401).json({message: 'Unauthenticated user.'});
    return;
  }

  if (!imageFile) {
    res.status(400).json({message: 'No image file uploaded.'});
    return;
  }

  try {
    // 1. Save the uploaded file buffer to a temporary file
    const tempDir = path.join(__dirname, '..', '..', 'temp');
    await fs.mkdir(tempDir, { recursive: true }); // Ensure temp directory exists
    tempFilePath = path.join(tempDir, `${Date.now()}-${imageFile.originalname}`);
    await fs.writeFile(tempFilePath, imageFile.buffer);

    // 2. Call the single orchestrator function from the AI service
    console.log(`Starting AI receipt processing for user ${userId}...`);
    const parsedReceiptData = await aiService.processReceipt(tempFilePath);
    console.log(`AI processing complete for user ${userId}.`);

    // 3. Save the final processed data to the database
    const newReceipt = await receiptService.createReceiptAndProcessData(
      userId,
      imageFile.originalname,
      parsedReceiptData
    );

    res.status(201).json ({ message: 'Receipt uploaded and processed successfully.', receipt: newReceipt});

  } catch (error) {
    console.error (`Error during AI processing for user ${userId}: `, error);

    // 4. Handle specific errors from each step in the AI chain
    if (error instanceof Error) {
        switch (error.message) {
            case 'PDF_PARSING_FAILED':
                res.status(422).json({ message: 'Could not read the provided PDF file.' });
                return;
            case 'AI_VALIDATION_FAILED':
                res.status(422).json({ message: 'The uploaded document does not appear to be a grocery receipt.' });
                return;
            case 'AI_JSON_STRUCTURE_FAILED': // This is a general term for all structuring errors now
                res.status(500).json({ message: 'Failed to analyze the receipt text. Please try again.' });
                return;
        }
    }

    next(error); // Pass any other unexpected errors to a generic error handler
  } finally {
    // 5. Clean up: always delete the temporary file, even if an error occurred
    if (tempFilePath) {
        try {
            await fs.unlink(tempFilePath);
            console.log(`Successfully deleted temporary file: ${tempFilePath}`);
        } catch (cleanupError) {
            console.error(`Failed to delete temporary file: ${tempFilePath}`, cleanupError);
        }
    }
  }
};

// Verify document page User interaction
export const getReceiptById: RequestHandler = async ( req: Request, res: Response, next: NextFunction) => {
  const { receiptId } = req.params;
  const userId = req.userId;

  if (!userId) {
    console.error(' Error in getAllReceipts: userId is missing.');
    res.status(401).json({ message: 'Unauthenticated user.'});
    return;
  }

  try {
    const receipt = await receiptService.getReceiptById(receiptId, userId);
    if (receipt) {
      res.json(receipt);
    } else {
      console.warn(`Receipt not found or unauthorized for ID: ${receiptId} by user: ${userId}`);
      res.status(404).json({message: 'Receipt not found or unauthorized access.'})
    }
  } catch (error) {
    console.error('Error fetching single receipt: ', error);
    next(error);
  }
};

// Endpoint for Next phase Calendar/shopping history multi Receipt fetch
export const getAllReceipts: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.userId;

  if(!userId) {
    console.error('Error in getAllReceipts: userId is missing.');
    res.status(401).json({ message: 'Unauthenticated user.'});
    return;
  }

  try {
    const receipts = await receiptService.getAllReceipts(userId);
    res.json(receipts);
  } catch (error) {
    console.error('Error fetching all receipts: ', error);
    next(error);
  }
};

// upadate the summary and reaggregate the user's overall summary after user verification/correction.
export const verifyAndFinalizeReceipt: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  const {receiptId} = req.params;
  const userId = req.userId;
  const {nutritionSummary, aiFeedbackReceipt, items: updatedItemsData} = req.body;

  if (!userId) {
    console.error('Error in verifyAndFinalizeReceipt: userId is missing.');
    res.status(401).json({ message: 'Unauthenticated user.'});
    return;
  }

  try {
    // Authenticate user and verify receipt ownership
    const updatedReceipt = await receiptService.updateReceiptAfterVerification(
      receiptId,
      userId,
      { nutritionSummary, aiFeedbackReceipt, items: updatedItemsData }
    );

    res.json({ message: 'Receipt verified and finalized.', receipt: updatedReceipt})
  } catch (error){
    console.error('Error verifying and finalizing receipt: ', error);
    next(error);
  }
}