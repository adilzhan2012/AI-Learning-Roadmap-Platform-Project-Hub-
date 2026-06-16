import { Router } from 'express';
import { ResourceController } from '../controllers/resource.controller.js';

const router = Router();
const controller = new ResourceController();

router.get('/', controller.getAllResources);
router.post('/:id/bookmark', controller.toggleBookmark);
router.post('/', controller.createResource);

export default router;
