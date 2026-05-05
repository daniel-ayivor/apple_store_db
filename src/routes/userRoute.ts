import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { userController } from '../controllers/userController';

const router = Router();

// All user routes require authentication
router.use(authenticateToken);

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.delete('/account', userController.deleteAccount);

export default router;