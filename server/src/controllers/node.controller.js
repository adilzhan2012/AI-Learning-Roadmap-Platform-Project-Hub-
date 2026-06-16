import { NodeService } from '../services/node.service.js';

const nodeService = new NodeService();

export class NodeController {
  async createNode(req, res) {
    try {
      const node = await nodeService.createNode(req.body);
      res.status(201).json(node);
    } catch (err) {
      console.error('createNode error:', err);
      res.status(500).json({ error: err.message });
    }
  }

  async updateNode(req, res) {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ error: 'Node ID is required' });
      const node = await nodeService.updateNode(id, req.body);
      res.json(node);
    } catch (err) {
      console.error('updateNode error:', err);
      res.status(500).json({ error: err.message });
    }
  }

  async deleteNode(req, res) {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ error: 'Node ID is required' });
      await nodeService.deleteNode(id);
      res.json({ success: true, message: 'Node deleted successfully' });
    } catch (err) {
      console.error('deleteNode error:', err);
      res.status(500).json({ error: err.message });
    }
  }

  async updateProgress(req, res) {
    try {
      const { id } = req.params; // progressId or nodeId depending on endpoint
      const { userId, nodeId, progress, completed } = req.body;
      
      const targetNodeId = nodeId || id;
      if (!userId || !targetNodeId) {
        return res.status(400).json({ error: 'userId and nodeId are required' });
      }

      const progressVal = parseInt(progress);
      if (isNaN(progressVal) || progressVal < 0 || progressVal > 100) {
        return res.status(400).json({ error: 'progress must be a number between 0 and 100' });
      }

      const completedBool = completed === undefined ? (progressVal === 100) : !!completed;

      const progressDoc = await nodeService.updateNodeProgress(userId, targetNodeId, progressVal, completedBool);
      res.json(progressDoc);
    } catch (err) {
      console.error('updateProgress error:', err);
      res.status(500).json({ error: err.message });
    }
  }
}
