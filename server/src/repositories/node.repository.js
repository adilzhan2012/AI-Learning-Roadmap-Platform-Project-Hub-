import { db } from '../config/firebase.js';

export class NodeRepository {
  async findById(id) {
    const docSnap = await db.collection('nodes').doc(id).get();
    if (!docSnap.exists) return null;
    return { id: docSnap.id, ...docSnap.data() };
  }

  async findByRoadmapId(roadmapId) {
    const snap = await db.collection('nodes').where('roadmapId', '==', roadmapId).get();
    const results = [];
    snap.forEach(doc => {
      results.push({ id: doc.id, ...doc.data() });
    });
    return results;
  }

  async save(node) {
    await db.collection('nodes').doc(node.id).set(node, { merge: true });
    return node;
  }

  async delete(id) {
    await db.collection('nodes').doc(id).delete();
    
    // Also delete any connections involving this node
    const connFromSnap = await db.collection('connections').where('fromNodeId', '==', id).get();
    const connToSnap = await db.collection('connections').where('toNodeId', '==', id).get();
    
    const batch = db.batch();
    connFromSnap.forEach(doc => batch.delete(doc.ref));
    connToSnap.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    
    return true;
  }

  async getConnectionsByRoadmap(roadmapId) {
    // 1. Fetch all nodes for this roadmap
    const nodes = await this.findByRoadmapId(roadmapId);
    const nodeIds = nodes.map(n => n.id);
    if (nodeIds.length === 0) return [];
    
    // 2. Fetch all connections
    const snap = await db.collection('connections').get();
    const results = [];
    snap.forEach(doc => {
      const data = doc.data();
      // Filter in-memory to only include connections where both fromNodeId and toNodeId are in nodeIds
      if (nodeIds.includes(data.fromNodeId) && nodeIds.includes(data.toNodeId)) {
        results.push({ id: doc.id, ...data });
      }
    });
    return results;
  }

  async saveConnection(conn) {
    await db.collection('connections').doc(conn.id).set(conn);
    return conn;
  }
}
