import { Router } from "express";
import multer from "multer";
import {
  //uploadReceipt,
  getReceiptById,
  getAllReceipts,
  verifyAndFinalizeReceipt,
} from '../controllers/receipt.controller'

//import { Request, Response } from 'express';
import { uploadSimulated } from '../controllers/uploadSimulated';


const router = Router();


const upload = multer({
  storage: multer.memoryStorage(),
  limits:{
    fileSize: 5 * 1024 * 1024, // file size limit 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG or PDF are allowed.'));
    }
  }
});

router.post('/upload-test', (req, res) => {
  console.log('✅ POST /upload-test reached');
  res.status(200).json({ message: 'Upload test passed' });
});

router.post('/upload', uploadSimulated);



//router.post('/upload', upload.single('receiptFile'), uploadReceipt);
/*router.post('/upload', upload.single('receiptFile'), async (req: Request, res: Response): Promise<void> => {
  console.log('Received POST /upload');
  const userId = req.header('X-User-Id');
  console.log('userId:', userId);

  if (!userId || !req.file) {
  console.log(' Missing user or file');
  res.status(400).json({ message: 'Missing user or file' });
  return;
  }
    console.log('File received:', req.file.originalname);


  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const receipt = await prisma.receipt.findFirst({
      where: { userId },
      orderBy: { purchaseDate: 'desc' },
    });

     console.log('🧾 Receipt found:', receipt?.id);

    if (!receipt) {
      res.status(404).json({ message: 'No receipt found for user' });
      return;
    }

    res.status(201).json({ receiptId: receipt.id });
    return;
  } catch (error) {
    console.error('Upload route error:', error);
    res.status(500).json({ message: 'Server error' });
    return;
  }
});*/

router.get('/:receiptId', getReceiptById);

router.get('/', getAllReceipts);

router.put('/:receiptId/verify', verifyAndFinalizeReceipt);

export default router;