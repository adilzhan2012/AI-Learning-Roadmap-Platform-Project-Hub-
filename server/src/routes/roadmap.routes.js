import { Router } from 'express';
import { RoadmapController } from '../controllers/roadmap.controller.js';

const router = Router();
const controller = new RoadmapController();

router.get('/', controller.getAllRoadmaps);
router.get('/:id', controller.getRoadmap);
router.post('/', controller.createRoadmap);

export default router;
