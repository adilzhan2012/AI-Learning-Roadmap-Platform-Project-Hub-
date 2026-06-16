import { UserRepository } from '../repositories/user.repository.js';
import { NodeRepository } from '../repositories/node.repository.js';
import { CourseContentRepository } from '../repositories/courseContent.repository.js';

const userRepository = new UserRepository();
const nodeRepository = new NodeRepository();
const courseContentRepository = new CourseContentRepository();

export class UserService {
  async syncUser(id, email, name) {
    let user = await userRepository.findById(id);
    if (!user) {
      user = {
        id,
        email,
        name: name || email.split('@')[0],
        learningHours: 0,
        quizAccuracy: 0,
        streakDays: 1,
        createdAt: new Date().toISOString()
      };
      await userRepository.save(user);
      
      await userRepository.addActivity(id, {
        title: 'Joined AI Learning Roadmap Platform — Project Hub! 🚀',
        icon: 'Sparkles',
        color: 'text-blue-500',
        time: 'Just now'
      });
    }
    return user;
  }

  async getDashboardMetrics(userId) {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error('User not found');

    const progressList = await userRepository.getProgress(userId);
    const activities = await userRepository.getActivities(userId);

    const activeNodesProgress = progressList.filter(p => p.progress > 0);
    const completedNodes = progressList.filter(p => p.completed);

    const activeCoursesList = [];
    for (const p of activeNodesProgress) {
      const node = await nodeRepository.findById(p.nodeId);
      if (node) {
        activeCoursesList.push({
          id: node.id,
          title: node.title,
          instructor: node.instructor,
          progress: p.progress,
          gradient: node.gradient || 'from-blue-500 to-indigo-500'
        });
      }
    }

    const stats = {
      learningHours: user.learningHours || 0,
      quizAccuracy: user.quizAccuracy || 0,
      streakDays: user.streakDays || 0,
      activeCoursesCount: activeCoursesList.length,
      completedCoursesCount: completedNodes.length
    };

    return {
      stats,
      activeCourses: activeCoursesList,
      activities
    };
  }

  async resetProgress(userId) {
    // 1. Delete course progress
    await userRepository.deleteProgressByUserId(userId);
    
    // 2. Delete internal lesson progress
    await courseContentRepository.deleteLessonProgressByUserId(userId);
    
    // 3. Reset user profile statistics
    await userRepository.update(userId, {
      learningHours: 0,
      quizAccuracy: 0,
      streakDays: 1
    });

    // 4. Log the reset activity
    await userRepository.addActivity(userId, {
      title: 'Reset all course progress and learning history 🔄',
      icon: 'RotateCcw',
      color: 'text-error',
      time: 'Just now'
    });

    return this.getDashboardMetrics(userId);
  }

  async addCustomActivity(userId, title, icon, color) {
    return userRepository.addActivity(userId, { title, icon, color });
  }

  async updateUserStats(userId, data) {
    return userRepository.update(userId, data);
  }
}
