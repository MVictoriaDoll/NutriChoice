import { Router } from 'express';
import {
  uploadSimulated,
  getReceiptById,
  getAllReceipts,
  verifyAndFinalizeReceipt,
} from '../controllers/receipt.controller';

const router = Router();

router.post('/upload', uploadSimulated);
router.get('/:receiptId', getReceiptById);
router.get('/', getAllReceipts);
router.put('/:receiptId/verify', verifyAndFinalizeReceipt);


export default router;
