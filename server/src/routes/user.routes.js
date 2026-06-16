import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';

const router = Router();
const controller = new UserController();

router.post('/', controller.syncUser);
router.get('/:id/dashboard', controller.getDashboard);
router.post('/:id/reset', controller.resetProgress);
router.patch('/:id', controller.updateProfile);

export default router;
