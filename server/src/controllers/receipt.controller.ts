import { Request, Response, NextFunction, RequestHandler } from 'express';
import { aiService } from 'src/services/ai.service';
import { receiptService } from 'src/services/receipt.services';

// Upload receipt page and AI to database
export const uploadReceipt: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.userId;
  const imageFile = req.file;

  if (!userId) {
    console.error('Error in uploadReceipt: userId is missing after authentication middleware.');
    // 401 unauthorized
    res.status(401).json({message: 'Unauthenticated user.'});
    return;
  }

  if (!imageFile) {
    // 400 Bad Request
    res.status(400).json({message: 'No image file uploaded.'});
    return;
  }

  const base64Image = imageFile.buffer.toString('base64');
  const mimeType = imageFile.mimetype;

  try {
    // --- Step 1: Initial AI Check for Document Validity / Receipt Recognition ---
    console.log(`Performing initial document validation with AI for user ${userId}...`);
    const isValid = await aiService.validateDocument(base64Image, mimeType);

    if (!isValid) {
      console.warn(`Document validation failed for user ${userId}.`);
      // 400 Bad Request
      res.status(400).json({
        message: 'Uploaded file is not a readable grocery receipt. Please upload a clean image or PDF of a receipt.',
        aiValidationResult: 'FALSE',
      });
      return;
    }
    console.log (`Initial document validation passed for user ${userId}. Proceeding with detailed analysis.`);

    // --- Step 2: Full Receipt Analysis with AI (Only if validation passed) ---
    const parsedReceiptData = await aiService.analyzeReceipt(base64Image, mimeType);
    console.log(`AI analysis complete for user ${userId}.`)

    // --- Step 3: Save the processed data to the database using a transaction ---
    const newReceipt = await receiptService.createReceiptAndProcessData(
      userId,
      imageFile.originalname,
      parsedReceiptData
    );

    res.status(201).json ({ message: 'Receipt uploaded and processed successfully.', receipt: newReceipt});

  } catch (error) {
    console.error ('Error during AI processing or receipt upload: ', error);

    next(error);
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