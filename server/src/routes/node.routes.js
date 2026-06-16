import { Router } from 'express';
import { NodeController } from '../controllers/node.controller.js';
import { CourseContentController } from '../controllers/courseContent.controller.js';

const router = Router();
const controller = new NodeController();
const contentController = new CourseContentController();

router.post('/', controller.createNode);
router.patch('/:id', controller.updateNode);
router.delete('/:id', controller.deleteNode);
router.patch('/progress/:id', controller.updateProgress);

// Gemini AI course content routes
router.get('/:id/content', contentController.getContent);
router.post('/:id/lessons/:lessonId/complete', contentController.completeLesson);

export default router;
