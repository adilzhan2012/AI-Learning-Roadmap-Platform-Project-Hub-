import { ResourceService } from '../services/resource.service.js';

const resourceService = new ResourceService();

export class ResourceController {
  async getAllResources(req, res) {
    try {
      const userId = req.query.userId || null;
      const resources = await resourceService.getAllResources(userId);
      res.json(resources);
    } catch (err) {
      console.error('getAllResources error:', err);
      res.status(500).json({ error: err.message });
    }
  }

  async toggleBookmark(req, res) {
    try {
      const { id } = req.params; // Resource ID
      const { userId } = req.body;
      if (!id || !userId) {
        return res.status(400).json({ error: 'resource id (in params) and userId (in body) are required' });
      }
      const result = await resourceService.toggleBookmark(userId, id);
      res.json(result);
    } catch (err) {
      console.error('toggleBookmark error:', err);
      res.status(500).json({ error: err.message });
    }
  }

  async createResource(req, res) {
    try {
      const resource = await resourceService.createResource(req.body);
      res.status(201).json(resource);
    } catch (err) {
      console.error('createResource error:', err);
      res.status(500).json({ error: err.message });
    }
  }
}
