import { db } from '../config/firebase.js';

export class CourseContentRepository {
  async findByNodeId(nodeId, lang = 'ru') {
    const docId = `${nodeId}_${lang}`;
    const docSnap = await db.collection('course_contents').doc(docId).get();
    if (!docSnap.exists) return null;
    return docSnap.data();
  }

  async save(nodeId, lang = 'ru', content) {
    const docId = `${nodeId}_${lang}`;
    const data = {
      nodeId,
      lang,
      lessons: content.lessons,
      createdAt: new Date().toISOString()
    };
    await db.collection('course_contents').doc(docId).set(data);
    return data;
  }

  async saveLessonProgress(userId, nodeId, lessonId, completed) {
    const id = `${userId}_${nodeId}_${lessonId}`;
    const data = {
      userId,
      nodeId,
      lessonId,
      completed,
      completedAt: new Date().toISOString()
    };
    await db.collection('user_lesson_progress').doc(id).set(data);
    return data;
  }

  async getLessonProgress(userId, nodeId) {
    const snap = await db.collection('user_lesson_progress')
      .where('userId', '==', userId)
      .where('nodeId', '==', nodeId)
      .get();
    
    const results = [];
    snap.forEach(doc => {
      results.push(doc.data());
    });
    return results;
  }

  async deleteLessonProgressByUserId(userId) {
    const snap = await db.collection('user_lesson_progress')
      .where('userId', '==', userId)
      .get();
    
    const batch = db.batch();
    snap.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  }
}
