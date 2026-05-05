import { Router } from 'express';
import { productController } from '../controllers/productController';
import { authenticateToken, authenticateAdmin } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', productController.getAllProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/category/:category', productController.getProductsByCategory);
router.get('/:id', productController.getProductById);

// Admin only routes
router.post('/', authenticateToken, authenticateAdmin, productController.createProduct);
router.put('/:id', authenticateToken, authenticateAdmin, productController.updateProduct);
router.delete('/:id', authenticateToken, authenticateAdmin, productController.deleteProduct);

export default router;