import { db } from '../config/firebase.js';

export class UserRepository {
  async findById(id) {
    const docRef = db.collection('users').doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) return null;
    return { id: docSnap.id, ...docSnap.data() };
  }

  async save(user) {
    await db.collection('users').doc(user.id).set(user, { merge: true });
    return user;
  }

  async update(id, data) {
    await db.collection('users').doc(id).update(data);
    return this.findById(id);
  }

  async getProgress(userId) {
    const snap = await db.collection('progress').where('userId', '==', userId).get();
    const results = [];
    snap.forEach(doc => {
      results.push({ id: doc.id, ...doc.data() });
    });
    return results;
  }

  async getProgressByNode(userId, nodeId) {
    const id = `${userId}_${nodeId}`;
    const snap = await db.collection('progress').doc(id).get();
    if (!snap.exists) return null;
    return { id: snap.id, ...snap.data() };
  }

  async saveProgress(userId, nodeId, progressVal, completed) {
    const id = `${userId}_${nodeId}`;
    const data = {
      userId,
      nodeId,
      progress: progressVal,
      completed,
      updatedAt: new Date().toISOString()
    };
    await db.collection('progress').doc(id).set(data, { merge: true });
    return { id, ...data };
  }

  async deleteProgressByUserId(userId) {
    const snap = await db.collection('progress').where('userId', '==', userId).get();
    const batch = db.batch();
    snap.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  }

  async getActivities(userId) {
    const snap = await db.collection('activities')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();
    
    const results = [];
    snap.forEach(doc => {
      results.push({ id: doc.id, ...doc.data() });
    });
    return results;
  }

  async addActivity(userId, activity) {
    const docRef = db.collection('activities').doc();
    const data = {
      userId,
      title: activity.title,
      time: activity.time || 'Just now',
      icon: activity.icon || 'Activity',
      color: activity.color || 'text-primary',
      createdAt: new Date().toISOString()
    };
    await docRef.set(data);
    return { id: docRef.id, ...data };
  }

  async getBookmarks(userId) {
    const snap = await db.collection('bookmarks').where('userId', '==', userId).get();
    const results = [];
    snap.forEach(doc => {
      results.push({ id: doc.id, ...doc.data() });
    });
    return results;
  }

  async addBookmark(userId, resourceId) {
    const id = `${userId}_${resourceId}`;
    const data = { userId, resourceId, createdAt: new Date().toISOString() };
    await db.collection('bookmarks').doc(id).set(data);
    return { id, ...data };
  }

  async deleteBookmark(userId, resourceId) {
    const id = `${userId}_${resourceId}`;
    await db.collection('bookmarks').doc(id).delete();
    return true;
  }
}
