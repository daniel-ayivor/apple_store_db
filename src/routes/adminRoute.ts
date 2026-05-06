import { Router } from 'express';
import { adminController } from '../controllers/adminController';
import { authenticateAdmin } from '../middleware/auth';

const router = Router();

// All admin routes require admin authentication
router.use(authenticateAdmin);

router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.post('/users/admin', adminController.createAdmin);
router.post('/users/create-direct', adminController.createAdminDirect);
router.put('/users/:id/promote', adminController.promoteToAdmin);
router.put('/users/:id/demote', adminController.demoteToCustomer);
router.delete('/users/:id', adminController.deleteUser);
router.get('/stats', adminController.getStats);

export default router;