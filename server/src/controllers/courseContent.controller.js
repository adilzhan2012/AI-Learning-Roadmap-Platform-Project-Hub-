import { NodeService } from '../services/node.service.js';

const nodeService = new NodeService();

export class CourseContentController {
  async getContent(req, res) {
    try {
      const { id } = req.params; // Node ID
      const userId = req.query.userId || null;
      const lang = req.query.lang || 'ru';
      if (!id) {
        return res.status(400).json({ error: 'Node ID (id parameter) is required' });
      }
      const data = await nodeService.getOrGenerateCourseContent(id, userId, lang);
      res.json(data);
    } catch (err) {
      console.error('CourseContentController.getContent error:', err);
      res.status(500).json({ error: err.message });
    }
  }

  async completeLesson(req, res) {
    try {
      const { id, lessonId } = req.params; // Node ID and Lesson ID
      const { userId, lang } = req.body;
      if (!id || !lessonId || !userId) {
        return res.status(400).json({ error: 'userId (in body), nodeId (in params), and lessonId (in params) are required' });
      }
      const result = await nodeService.completeLesson(userId, id, lessonId, lang || 'ru');
      res.json(result);
    } catch (err) {
      console.error('CourseContentController.completeLesson error:', err);
      res.status(500).json({ error: err.message });
    }
  }
}
