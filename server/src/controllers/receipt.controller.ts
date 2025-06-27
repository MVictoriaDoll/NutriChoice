import { Request, Response, NextFunction, RequestHandler } from 'express'
import { aiService } from '../services/ai.service'
import { receiptService } from '../services/receipt.services'

// --- Step 1: Handle file upload and initial AI processing ---
export const uploadReceipt: RequestHandler = async (req, res, next) => {
  const userId = req.userId
  const imageFile = req.file

  if (!userId) {
    console.error('Error in uploadReceipt: userId is missing.')
    res.status(401).json({ message: 'Unauthenticated user.' })
    return
  }
  if (!imageFile) {
    res.status(400).json({ message: 'No image file uploaded.' })
    return
  }

  const base64Image = imageFile.buffer.toString('base64')
  const mimeType = imageFile.mimetype

  try {
    // Initial validation...
    const isValid = await aiService.validateDocument(base64Image, mimeType)
    if (!isValid) {
      res.status(400).json({
        message: 'Uploaded file is not a readable grocery receipt.',
        aiValidationResult: 'FALSE',
      })
      return
    }

    const parsedReceiptData = await aiService.analyzeReceipt(base64Image, mimeType)
    const newReceipt = await receiptService.createReceiptAndProcessData(
      userId,
      imageFile.originalname,
      parsedReceiptData
    )

    res.status(201).json({
      message: 'Receipt uploaded and processed successfully.',
      receipt: newReceipt,
    })
    return
  } catch (error) {
    console.error('Error during AI processing or receipt upload: ', error)
    next(error)
    return
  }
}

// --- Step 2: Retrieve a single receipt ---
export const getReceiptById: RequestHandler = async (req, res, next) => {
  const { receiptId } = req.params
  const userId = req.userId

  if (!userId) {
    console.error('Error in getReceiptById: userId is missing.')
    res.status(401).json({ message: 'Unauthenticated user.' })
    return
  }

  try {
    const receipt = await receiptService.getReceiptById(receiptId, userId)
    if (receipt) {
      res.json(receipt)
      return
    } else {
      res.status(404).json({ message: 'Receipt not found or unauthorized.' })
      return
    }
  } catch (error) {
    console.error('Error fetching single receipt: ', error)
    next(error)
    return
  }
}

// --- Step 3: Retrieve all receipts for user ---
export const getAllReceipts: RequestHandler = async (req, res, next) => {
  const userId = req.userId

  if (!userId) {
    console.error('Error in getAllReceipts: userId is missing.')
    res.status(401).json({ message: 'Unauthenticated user.' })
    return
  }

  try {
    const receipts = await receiptService.getAllReceipts(userId)
    res.json(receipts)
    return
  } catch (error) {
    console.error('Error fetching all receipts: ', error)
    next(error)
    return
  }
}

// --- Step 4: OCR retrieval endpoint ---
export const ocrReceipt: RequestHandler = async (req, res, next) => {
  const { receiptId } = req.params
  const userId = req.userId

  if (!userId) {
    console.error('Error in ocrReceipt: userId is missing.')
    res.status(401).json({ message: 'Unauthenticated user.' })
    return
  }

  try {
    const receipt = await receiptService.getReceiptById(receiptId, userId)
    if (!receipt?.items) {
      res.status(404).json({ message: 'Parsed data not found.' })
      return
    }
    res.json({ items: receipt.items })
    return
  } catch (error) {
    console.error('Error performing OCR retrieval: ', error)
    next(error)
    return
  }
}

// --- Step 5: Finalize after user verification/correction ---
export const verifyAndFinalizeReceipt: RequestHandler = async (req, res, next) => {
  const { receiptId } = req.params
  const userId = req.userId
  const { nutritionSummary, aiFeedbackReceipt, items: updatedItemsData } = req.body

  if (!userId) {
    console.error('Error in verifyAndFinalizeReceipt: userId is missing.')
    res.status(401).json({ message: 'Unauthenticated user.' })
    return
  }

  try {
    const updatedReceipt = await receiptService.updateReceiptAfterVerification(
      receiptId,
      userId,
      { nutritionSummary, aiFeedbackReceipt, items: updatedItemsData }
    )
    res.json({ message: 'Receipt verified and finalized.', receipt: updatedReceipt })
    return
  } catch (error) {
    console.error('Error verifying and finalizing receipt: ', error)
    next(error)
    return
  }
}
