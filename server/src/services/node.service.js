import { NodeRepository } from '../repositories/node.repository.js';
import { UserRepository } from '../repositories/user.repository.js';
import { CourseContentRepository } from '../repositories/courseContent.repository.js';
import { GeminiService } from './gemini.service.js';

const nodeRepository = new NodeRepository();
const userRepository = new UserRepository();
const courseContentRepository = new CourseContentRepository();
const geminiService = new GeminiService();

export class NodeService {
  async createNode(nodeData) {
    if (!nodeData.title || !nodeData.roadmapId) throw new Error('Title and roadmapId are required');
    const id = nodeData.id || `node-${Date.now()}`;
    const node = {
      id,
      roadmapId: nodeData.roadmapId,
      title: nodeData.title,
      description: nodeData.description || '',
      level: nodeData.level || 'Beginner',
      hours: nodeData.hours || '2h',
      lessons: nodeData.lessons || 5,
      icon: nodeData.icon || 'BookOpen',
      category: nodeData.category || 'General',
      instructor: nodeData.instructor || 'AI Instructor',
      rating: nodeData.rating || 5.0,
      students: nodeData.students || '0',
      gradient: nodeData.gradient || 'from-blue-500 to-indigo-500',
      x: nodeData.x !== undefined ? parseFloat(nodeData.x) : 0,
      y: nodeData.y !== undefined ? parseFloat(nodeData.y) : 0
    };
    return nodeRepository.save(node);
  }

  async updateNode(id, nodeData) {
    const existing = await nodeRepository.findById(id);
    if (!existing) throw new Error('Node not found');
    const updated = { ...existing, ...nodeData };
    return nodeRepository.save(updated);
  }

  async deleteNode(id) {
    const existing = await nodeRepository.findById(id);
    if (!existing) throw new Error('Node not found');
    return nodeRepository.delete(id);
  }

  async updateNodeProgress(userId, nodeId, progressVal, completed) {
    const node = await nodeRepository.findById(nodeId);
    if (!node) throw new Error('Node not found');

    const prevProgress = await userRepository.getProgressByNode(userId, nodeId);
    const prevCompleted = prevProgress ? prevProgress.completed : false;
    const prevVal = prevProgress ? prevProgress.progress : null;

    const progressDoc = await userRepository.saveProgress(userId, nodeId, progressVal, completed);

    const user = await userRepository.findById(userId);
    if (user) {
      let hoursUpdate = user.learningHours || 0;

      if (prevVal === null && progressVal === 0) {
        await userRepository.addActivity(userId, {
          title: `Enrolled in course: ${node.title} 📖`,
          icon: 'PlayCircle',
          color: 'text-blue-500'
        });
      } else if (!prevCompleted && completed) {
        hoursUpdate += parseInt(node.hours) || 4;
        const newAccuracy = Math.min(100, Math.max(70, Math.floor(75 + Math.random() * 25)));

        await userRepository.update(userId, {
          learningHours: hoursUpdate,
          quizAccuracy: Math.floor(((user.quizAccuracy || 85) + newAccuracy) / 2)
        });

        await userRepository.addActivity(userId, {
          title: `Completed course: ${node.title} 🎓`,
          icon: 'CheckCircle',
          color: 'text-green-500'
        });

        await userRepository.addActivity(userId, {
          title: `Passed final test for ${node.title} with score ${newAccuracy}% 🏆`,
          icon: 'Trophy',
          color: 'text-amber-500'
        });
      }
    }

    return progressDoc;
  }

  // Gemini & Course Content Services
  async getOrGenerateCourseContent(nodeId, userId = null, lang = 'ru') {
    const node = await nodeRepository.findById(nodeId);
    if (!node) throw new Error('Node (Course) not found');

    let content = await courseContentRepository.findByNodeId(nodeId, lang);
    if (!content) {
      // Generate using Gemini
      console.log(`Course content not found for node: ${node.title} in language: ${lang}. Triggering Gemini generation...`);
      const generated = await geminiService.generateCourseContent(node.title, node.description, lang);
      content = await courseContentRepository.save(nodeId, lang, generated);
    }

    let completedLessons = [];
    if (userId) {
      const progress = await courseContentRepository.getLessonProgress(userId, nodeId);
      completedLessons = progress.filter(p => p.completed).map(p => p.lessonId);
    }

    return {
      nodeId,
      lessons: content.lessons,
      completedLessons
    };
  }

  async completeLesson(userId, nodeId, lessonId, lang = 'ru') {
    const node = await nodeRepository.findById(nodeId);
    if (!node) throw new Error('Node not found');

    // Save lesson completion in Firestore
    const progress = await courseContentRepository.saveLessonProgress(userId, nodeId, lessonId, true);

    // Fetch total generated lessons count
    const content = await courseContentRepository.findByNodeId(nodeId, lang);
    const totalLessons = content ? content.lessons.length : 0;
    const lessonTitle = content?.lessons.find(l => l.id === lessonId)?.title || lessonId;

    // Fetch user's completed lessons count for this node
    const userCompleted = await courseContentRepository.getLessonProgress(userId, nodeId);
    const completedCount = userCompleted.filter(p => p.completed).length;

    // Log lesson completion activity
    await userRepository.addActivity(userId, {
      title: `Completed lesson: ${lessonTitle} in ${node.title} ✔`,
      icon: 'BookOpen',
      color: 'text-primary'
    });

    // Check if all lessons are completed
    if (totalLessons > 0 && completedCount >= totalLessons) {
      // Automatically complete the entire course node
      console.log(`User ${userId} completed all ${completedCount}/${totalLessons} lessons. Automatically completing course: ${node.title}`);
      await this.updateNodeProgress(userId, nodeId, 100, true);
    } else {
      // Otherwise, update course node progress incrementally
      const progressPercent = Math.min(99, Math.floor((completedCount / totalLessons) * 100));
      await this.updateNodeProgress(userId, nodeId, progressPercent, false);
    }

    return progress;
  }
}
