import { Router } from 'express';
import userRoutes from './user.routes';
import receiptRoutes from './receipt.routes'
import healthRoutes from './health.routes'

const router = Router();

// Health-check for testing
router.use('/health', healthRoutes)

router.use('/users', userRoutes);
router.use('/receipts', receiptRoutes);

export default router;