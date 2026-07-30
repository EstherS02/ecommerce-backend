import express from 'express';
import {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct
} from '../controllers/productController.js';
import { adminMiddleware } from '../middleware/adimMiddleware.js'
import { authMiddleware } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/:id', getProductById);
router.get('/', getProducts);
router.post(
    '/',
    authMiddleware,
    adminMiddleware,
    upload.single("image"),
    createProduct
);
router.put('/:id', updateProduct);
router.delete(
    '/:id',
    authMiddleware,
    adminMiddleware,
    deleteProduct
)

export default router;