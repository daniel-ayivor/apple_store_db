import { Router } from 'express';
import { orderController } from '../controllers/orderController';
import { authenticateToken, authenticateAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', orderController.getUserOrders);
router.get('/:id', orderController.getOrderById);
router.post('/', orderController.createOrder);
router.put('/:id/status', authenticateAdmin, orderController.updateOrderStatus);

export default router;