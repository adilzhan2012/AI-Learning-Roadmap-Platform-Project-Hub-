import { RoadmapRepository } from '../repositories/roadmap.repository.js';
import { NodeRepository } from '../repositories/node.repository.js';
import { UserRepository } from '../repositories/user.repository.js';

const roadmapRepository = new RoadmapRepository();
const nodeRepository = new NodeRepository();
const userRepository = new UserRepository();

export class RoadmapService {
  async getAllRoadmaps() {
    return roadmapRepository.findAll();
  }

  async getRoadmapDetails(id, userId = null) {
    const roadmap = await roadmapRepository.findById(id);
    if (!roadmap) throw new Error('Roadmap not found');

    const nodes = await nodeRepository.findByRoadmapId(id);
    const connections = await nodeRepository.getConnectionsByRoadmap(id);

    let userProgressMap = {};
    if (userId) {
      const progressList = await userRepository.getProgress(userId);
      progressList.forEach(p => {
        userProgressMap[p.nodeId] = p;
      });
    }

    // Attach progress to nodes
    const nodesWithProgress = nodes.map(node => {
      const prog = userProgressMap[node.id];
      return {
        ...node,
        progress: prog ? prog.progress : null,
        completed: prog ? prog.completed : false
      };
    });

    return {
      ...roadmap,
      nodes: nodesWithProgress,
      connections
    };
  }

  async createRoadmap(roadmapData) {
    if (!roadmapData.title) throw new Error('Roadmap title is required');
    const id = roadmapData.id || `roadmap-${Date.now()}`;
    const roadmap = {
      id,
      title: roadmapData.title,
      instructor: roadmapData.instructor || 'AI Academy Team',
      rating: roadmapData.rating || 5.0,
      students: roadmapData.students || '0',
      level: roadmapData.level || 'Beginner',
      hours: roadmapData.hours || '10h',
      lessons: roadmapData.lessons || 10,
      icon: roadmapData.icon || 'Brain',
      category: roadmapData.category || 'AI Fundamentals',
      gradient: roadmapData.gradient || 'from-blue-500 to-indigo-500',
      description: roadmapData.description || ''
    };
    return roadmapRepository.save(roadmap);
  }
}
