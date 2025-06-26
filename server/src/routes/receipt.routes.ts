import { Router } from "express";
import multer from "multer";
import {
  uploadReceipt,
  getReceiptById,
  getAllReceipts,
  verifyAndFinalizeReceipt,
} from '../controllers/receipt.controller'

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

router.post('/upload', upload.single('receiptFile'), uploadReceipt);

router.get('/:receiptId', getReceiptById);

router.get('/', getAllReceipts);

router.put('/:receiptId/verify', verifyAndFinalizeReceipt);

export default router;