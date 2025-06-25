import { Router } from 'express';
import userRoutes from './user.routes';
import receiptRoutes from './receipt.routes'

const router = Router();

router.use('/users', userRoutes);
router.use('/receipts', receiptRoutes);

export default router;