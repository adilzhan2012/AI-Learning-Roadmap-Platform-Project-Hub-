import { ResourceRepository } from '../repositories/resource.repository.js';
import { UserRepository } from '../repositories/user.repository.js';

const resourceRepository = new ResourceRepository();
const userRepository = new UserRepository();

export class ResourceService {
  async getAllResources(userId = null) {
    const resources = await resourceRepository.findAll();
    
    if (!userId) {
      return resources.map(r => ({ ...r, bookmarked: false }));
    }

    const bookmarks = await userRepository.getBookmarks(userId);
    const bookmarkedIds = bookmarks.map(b => b.resourceId);

    return resources.map(r => ({
      ...r,
      bookmarked: bookmarkedIds.includes(r.id)
    }));
  }

  async toggleBookmark(userId, resourceId) {
    const resource = await resourceRepository.findById(resourceId);
    if (!resource) throw new Error('Resource not found');

    const bookmarks = await userRepository.getBookmarks(userId);
    const existing = bookmarks.find(b => b.resourceId === resourceId);

    if (existing) {
      await userRepository.deleteBookmark(userId, resourceId);
      return { bookmarked: false };
    } else {
      await userRepository.addBookmark(userId, resourceId);
      
      // Log bookmark activity
      await userRepository.addActivity(userId, {
        title: `Bookmarked resource: ${resource.title} 🔖`,
        icon: 'Bookmark',
        color: 'text-purple-500'
      });

      return { bookmarked: true };
    }
  }

  async createResource(resourceData) {
    const id = resourceData.id || `res-${Date.now()}`;
    const resource = {
      id,
      type: resourceData.type || 'article',
      title: resourceData.title,
      desc: resourceData.desc || '',
      tags: resourceData.tags || '',
      author: resourceData.author || '',
      meta: resourceData.meta || '',
      date: resourceData.date || new Date().toLocaleDateString(),
      isFeatured: !!resourceData.isFeatured
    };
    return resourceRepository.save(resource);
  }
}
