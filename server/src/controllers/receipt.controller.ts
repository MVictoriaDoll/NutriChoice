import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import config from 'src/config';



const prisma = new PrismaClient();



export const uploadReceipt = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.userId;
  const imageFile = req.file;

  if (!userId) {
    console.error('Error in uploadReceipt: userId is missing after authentication middleware.');
    // 401 unauthorized
    return res.status(401).json({message: 'Unauthenticated user.'});
  }

  if (!imageFile) {
    // 400 Bad Request
    return res.status(400).json({message: 'No image file uploaded.'})
  }

  const base64Image = imageFile.buffer.toString('base64');
  const mimeType = imageFile.mimetype;

  try {
    // --- Step 1: Initial AI Check for Document Validity / Receipt Recognition ---

    console.log(`Performing initial document validation with AI for user ${userId}...`);



    if (isValidReceiptText !== 'TRUE') {
      console.warn(`Document validation failed for user ${userId}. AI response: ${isValidReceiptText}`);
      // 400 Bad Request
      return res.status(400).json({
        message: 'Uploaded file is not a readable grocery receipt. Please upload a clean image or PDF of a receipt.',
        aiValidationResult: isValidReceiptText,
      });
    }
    console.log (`Initial document validation passed for user ${userId}. Proceeding with detailed analysis.`);

    // --- Step 2: Full Receipt Analysis with AI (Only if validation passed) ---


    console.log(`LangChain/Gemini processing complete for user ${userId}. Data:`, parsedReceiptData);

    // --- Step 3: Save the processed data to the database using a transaction ---

    const result = await prisma.$transaction(async (prismaTx) => {
      const newReceipt = await prismaTx.receipt.create({

    });

    // Items table


    await _processAndAggregateReceiptData (
      prismaTx,
      userId,
      newReceipt.id,
      newReceipt.nutritionSummary,
      newReceipt.aiFeedbackReceipt,
      parsedReceiptData.items,
      'processed'
    );

    return newReceipt;
    });

    res.status(201).json({message: 'Receipt uploaded and processed successfully by AI.', receipt: result});
  }
}