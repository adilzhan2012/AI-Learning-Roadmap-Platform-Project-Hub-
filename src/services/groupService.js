import { db, auth, functions } from '../firebase.js';
import { httpsCallable } from 'firebase/functions';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';

export async function searchUsersByUsername(queryStr) {
  try {
    const searchFn = httpsCallable(functions, 'searchUsersByUsername');
    const res = await searchFn({ query: queryStr });
    return res.data?.users || [];
  } catch (err) {
    console.error("searchUsersByUsername error:", err);
    return [];
  }
}

export async function createGroup(courseId, courseTitle, invitees = []) {
  try {
    const createGroupFn = httpsCallable(functions, 'createGroup');
    const res = await createGroupFn({ courseId, courseTitle, invitees });
    return res.data;
  } catch (err) {
    console.error("createGroup error:", err);
    throw err;
  }
}

export async function startGroupLesson(groupId) {
  try {
    const startFn = httpsCallable(functions, 'startGroupLesson');
    const res = await startFn({ groupId });
    return res.data;
  } catch (err) {
    console.error("startGroupLesson error:", err);
    throw err;
  }
}

export async function removeGroupMember(groupId, memberIdToRemove) {
  try {
    const removeFn = httpsCallable(functions, 'removeGroupMember');
    const res = await removeFn({ groupId, memberIdToRemove });
    return res.data;
  } catch (err) {
    console.error("removeGroupMember error:", err);
    throw err;
  }
}

export async function updateGroupMemberProgress(groupId, nodeId, nodeLabel, isCompleted = true, isHomework = false) {
  try {
    const updateFn = httpsCallable(functions, 'updateGroupMemberProgress');
    const res = await updateFn({ groupId, nodeId, nodeLabel, isCompleted, isHomework });
    return res.data;
  } catch (err) {
    console.error("updateGroupMemberProgress error:", err);
    return { success: false };
  }
}

export async function respondToGroupInvitation(invitationId, status) {
  if (!['accepted', 'declined'].includes(status)) {
    throw new Error('Invalid status');
  }
  const invRef = doc(db, 'group_invitations', invitationId);
  await updateDoc(invRef, { status });
}

export async function sendGroupChatMessage(groupId, text) {
  const user = auth.currentUser;
  if (!user || !text.trim()) return;

  const messagesCol = collection(db, 'group_chats', groupId, 'messages');
  await addDoc(messagesCol, {
    senderId: user.uid,
    senderName: user.displayName || user.email?.split('@')[0] || 'Пользователь',
    senderAvatar: user.photoURL || null,
    text: text.trim(),
    createdAt: serverTimestamp()
  });
}

export function subscribeToGroup(groupId, onUpdate, onError) {
  const groupRef = doc(db, 'groups', groupId);
  return onSnapshot(groupRef, (snap) => {
    if (snap.exists()) {
      onUpdate({ id: snap.id, ...snap.data() });
    } else {
      onUpdate(null);
    }
  }, onError);
}

export function subscribeToGroupChat(groupId, onUpdate, onError) {
  const messagesCol = collection(db, 'group_chats', groupId, 'messages');
  const q = query(messagesCol, orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snap) => {
    const messages = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    onUpdate(messages);
  }, onError);
}

export function subscribeToUserInvitations(userId, onUpdate, onError) {
  if (!userId) return () => {};
  const invsCol = collection(db, 'group_invitations');
  const q = query(invsCol, where('inviteeId', '==', userId), where('status', '==', 'pending'));
  return onSnapshot(q, (snap) => {
    const invitations = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    onUpdate(invitations);
  }, onError);
}

export async function getUserGroupForCourse(userId, courseId) {
  if (!userId || !courseId) return null;
  const groupsCol = collection(db, 'groups');
  const q = query(
    groupsCol, 
    where('courseId', '==', courseId), 
    where('invitedUserIds', 'array-contains', userId)
  );
  const snap = await getDocs(q);
  const activeOrPending = snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .find(g => g.status === 'active' || g.status === 'pending');
  return activeOrPending || null;
}
