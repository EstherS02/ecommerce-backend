import express from 'express';
import {
    addCart,
    getCart,
    updateCart,
    removeCart,
    checkout
} from '../controllers/cartController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/checkout', authMiddleware, checkout)
router.post('/add', authMiddleware, addCart);
router.get('/', authMiddleware, getCart);
router.put('/update', authMiddleware, updateCart);
router.delete('/remove', authMiddleware, removeCart);

export default router;