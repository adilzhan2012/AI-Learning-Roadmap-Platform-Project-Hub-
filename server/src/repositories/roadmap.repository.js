import { db } from '../config/firebase.js';

export class RoadmapRepository {
  async findAll() {
    const snap = await db.collection('roadmaps').get();
    const results = [];
    snap.forEach(doc => {
      results.push({ id: doc.id, ...doc.data() });
    });
    return results;
  }

  async findById(id) {
    const docRef = db.collection('roadmaps').doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) return null;
    return { id: docSnap.id, ...docSnap.data() };
  }

  async save(roadmap) {
    await db.collection('roadmaps').doc(roadmap.id).set(roadmap);
    return roadmap;
  }
}
