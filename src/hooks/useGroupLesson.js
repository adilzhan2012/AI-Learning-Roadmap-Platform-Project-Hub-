import { useState, useEffect, useCallback } from 'react';
import { auth } from '../firebase.js';
import { 
  getUserGroupForCourse, 
  subscribeToGroup, 
  subscribeToGroupChat, 
  sendGroupChatMessage,
  startGroupLesson,
  removeGroupMember,
  updateGroupMemberProgress,
  deleteGroup
} from '../services/groupService.js';

export function useGroupLesson(courseId, initialGroupId = null) {
  const [group, setGroup] = useState(null);
  const [groupId, setGroupId] = useState(initialGroupId);
  const [chatMessages, setChatMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [insufficientCreditsUsers, setInsufficientCreditsUsers] = useState(null);
  const [starting, setStarting] = useState(false);

  // 1. Fetch group for course if groupId not provided
  useEffect(() => {
    let unsubGroup = () => {};
    let isMounted = true;

    async function initGroup() {
      if (!auth.currentUser || !courseId) {
        setLoading(false);
        return;
      }
      try {
        let activeGroupId = groupId;
        if (!activeGroupId) {
          const userGroup = await getUserGroupForCourse(auth.currentUser.uid, courseId);
          if (userGroup && isMounted) {
            activeGroupId = userGroup.id;
            setGroupId(activeGroupId);
          }
        }

        if (activeGroupId && isMounted) {
          unsubGroup = subscribeToGroup(activeGroupId, (updatedGroup) => {
            if (isMounted) {
              setGroup(updatedGroup);
              setLoading(false);
            }
          }, (err) => {
            console.error("Group subscribe error:", err);
            if (isMounted) setLoading(false);
          });
        } else {
          if (isMounted) setLoading(false);
        }
      } catch (err) {
        console.error("useGroupLesson init error:", err);
        if (isMounted) setLoading(false);
      }
    }

    initGroup();

    return () => {
      isMounted = false;
      unsubGroup();
    };
  }, [courseId, groupId]);

  // 2. Subscribe to chat if group active
  useEffect(() => {
    if (!groupId) return;
    const unsubChat = subscribeToGroupChat(groupId, (msgs) => {
      setChatMessages(msgs);
    }, (err) => {
      console.error("Chat subscribe error:", err);
    });

    return () => unsubChat();
  }, [groupId]);

  const handleSendMessage = useCallback(async (text) => {
    if (!groupId || !text.trim()) return;
    await sendGroupChatMessage(groupId, text);
  }, [groupId]);

  const handleStartGroup = useCallback(async () => {
    if (!groupId) return;
    setStarting(true);
    setError(null);
    setInsufficientCreditsUsers(null);

    try {
      const res = await startGroupLesson(groupId);
      if (res && res.error === 'INSUFFICIENT_CREDITS') {
        setInsufficientCreditsUsers(res.insufficientCreditsUsers);
        return false;
      }
      return true;
    } catch (err) {
      console.error("handleStartGroup error:", err);
      setError(err.message || 'Не удалось стартовать группу.');
      return false;
    } finally {
      setStarting(false);
    }
  }, [groupId]);

  const handleRemoveMember = useCallback(async (memberId) => {
    if (!groupId || !memberId) return;
    try {
      await removeGroupMember(groupId, memberId);
      return true;
    } catch (err) {
      console.error("handleRemoveMember error:", err);
      setError(err.message || 'Не удалось удалить участника.');
      return false;
    }
  }, [groupId]);

  const handleDeleteGroup = useCallback(async () => {
    if (!groupId) return;
    try {
      await deleteGroup(groupId);
      setGroupId(null);
      setGroup(null);
      return true;
    } catch (err) {
      console.error("handleDeleteGroup error:", err);
      setError(err.message || 'Не удалось удалить группу.');
      return false;
    }
  }, [groupId]);

  const handleUpdateProgress = useCallback(async (nodeId, nodeLabel, isCompleted = true, isHomework = false) => {
    if (!groupId || !nodeId) return;
    await updateGroupMemberProgress(groupId, nodeId, nodeLabel, isCompleted, isHomework);
  }, [groupId]);

  return {
    group,
    groupId,
    setGroupId,
    chatMessages,
    loading,
    error,
    insufficientCreditsUsers,
    setInsufficientCreditsUsers,
    starting,
    sendMessage: handleSendMessage,
    startGroup: handleStartGroup,
    removeMember: handleRemoveMember,
    deleteGroup: handleDeleteGroup,
    updateProgress: handleUpdateProgress
  };
}
