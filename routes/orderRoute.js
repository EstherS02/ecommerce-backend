import express from 'express';
import {
    getOrders,
    getOrderById,
    updateOrderStatus
} from '../controllers/orderController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adimMiddleware.js';

const router = express.Router();

router.patch('/:id/status', authMiddleware, adminMiddleware, updateOrderStatus )
router.get('/', authMiddleware, getOrders);
router.get('/:id', authMiddleware, getOrderById);

export default router;