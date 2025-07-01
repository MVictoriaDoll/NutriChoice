import { Router } from "express";
import multer from "multer";
import {
  uploadReceipt,
  getReceiptById,
  getAllReceipts,
  verifyAndFinalizeReceipt,
} from '../controllers/receipt.controller'

const router = Router();

router.get('/ping', (req, res) => {
  console.log('✅ GET /api/receipts/ping reached');
  res.send('pong');
});



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

//router.post('/upload', upload.single('receiptFile'), uploadReceipt);

router.post(
  '/upload',
  (req, res, next) => {
    console.log('📥 [PRE-MULTER] Request received!');
    next();
  },
  upload.single('receiptFile'),
  (req, res, next) => {
    console.log('📤 [POST-MULTER] File passed Multer.');
    if (!req.file) {
      console.warn('⚠️ No file received by Multer.');
    } else {
      console.log(`✅ File received: ${req.file.originalname}, mimetype: ${req.file.mimetype}`);
    }
    next();
  },
  uploadReceipt
);


router.get('/:receiptId', getReceiptById);

router.get('/', getAllReceipts);

router.put('/:receiptId/verify', verifyAndFinalizeReceipt);

export default router;