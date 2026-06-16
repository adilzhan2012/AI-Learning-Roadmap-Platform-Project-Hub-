import { RoadmapService } from '../services/roadmap.service.js';

const roadmapService = new RoadmapService();

export class RoadmapController {
  async getAllRoadmaps(req, res) {
    try {
      const roadmaps = await roadmapService.getAllRoadmaps();
      res.json(roadmaps);
    } catch (err) {
      console.error('getAllRoadmaps error:', err);
      res.status(500).json({ error: err.message });
    }
  }

  async getRoadmap(req, res) {
    try {
      const { id } = req.params;
      const userId = req.query.userId || null;
      if (!id) {
        return res.status(400).json({ error: 'Roadmap ID is required' });
      }
      const data = await roadmapService.getRoadmapDetails(id, userId);
      res.json(data);
    } catch (err) {
      console.error('getRoadmap error:', err);
      res.status(500).json({ error: err.message });
    }
  }

  async createRoadmap(req, res) {
    try {
      const roadmap = await roadmapService.createRoadmap(req.body);
      res.status(201).json(roadmap);
    } catch (err) {
      console.error('createRoadmap error:', err);
      res.status(500).json({ error: err.message });
    }
  }
}
