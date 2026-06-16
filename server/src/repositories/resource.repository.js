import { db } from '../config/firebase.js';

export class ResourceRepository {
  async findAll() {
    const snap = await db.collection('resources').get();
    const results = [];
    snap.forEach(doc => {
      results.push({ id: doc.id, ...doc.data() });
    });
    return results;
  }

  async findById(id) {
    const docSnap = await db.collection('resources').doc(id).get();
    if (!docSnap.exists) return null;
    return { id: docSnap.id, ...docSnap.data() };
  }

  async save(resource) {
    await db.collection('resources').doc(resource.id).set(resource);
    return resource;
  }
}
