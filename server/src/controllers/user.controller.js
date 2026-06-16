import { UserService } from '../services/user.service.js';

const userService = new UserService();

export class UserController {
  async syncUser(req, res) {
    try {
      const { id, email, name } = req.body;
      if (!id || !email) {
        return res.status(400).json({ error: 'id and email are required fields' });
      }
      const user = await userService.syncUser(id, email, name);
      res.json(user);
    } catch (err) {
      console.error('syncUser error:', err);
      res.status(500).json({ error: err.message });
    }
  }

  async getDashboard(req, res) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: 'User ID is required' });
      }
      const data = await userService.getDashboardMetrics(id);
      res.json(data);
    } catch (err) {
      console.error('getDashboard error:', err);
      res.status(500).json({ error: err.message });
    }
  }

  async resetProgress(req, res) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: 'User ID is required' });
      }
      const data = await userService.resetProgress(id);
      res.json(data);
    } catch (err) {
      console.error('resetProgress error:', err);
      res.status(500).json({ error: err.message });
    }
  }

  async updateProfile(req, res) {
    try {
      const { id } = req.params;
      const { name, learningHours, quizAccuracy, streakDays } = req.body;
      if (!id) {
        return res.status(400).json({ error: 'User ID is required' });
      }
      
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (learningHours !== undefined) updateData.learningHours = parseInt(learningHours);
      if (quizAccuracy !== undefined) updateData.quizAccuracy = parseInt(quizAccuracy);
      if (streakDays !== undefined) updateData.streakDays = parseInt(streakDays);

      const user = await userService.updateUserStats(id, updateData);
      
      await userService.addCustomActivity(id, `Updated profile details ✏️`, 'Settings', 'text-on-surface-variant');

      res.json(user);
    } catch (err) {
      console.error('updateProfile error:', err);
      res.status(500).json({ error: err.message });
    }
  }
}
