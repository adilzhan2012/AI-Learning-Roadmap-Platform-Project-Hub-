import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Loader2 } from 'lucide-react';
import { auth } from '../../firebase.js';

export default function ManageGroupModal({
  isOpen,
  onClose,
  group,
  onRemoveMember,
  onDeleteGroup
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState(null);

  if (!isOpen || !group) return null;

  const isCreator = group.creatorId === auth.currentUser?.uid;
  const membersList = Object.values(group.members || {});

  const handleDelete = async () => {
    if (!window.confirm('Вы уверены, что хотите полностью удалить эту группу?')) return;
    setIsDeleting(true);
    try {
      await onDeleteGroup(group.id);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Ошибка при удалении группы');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRemove = async (memberId) => {
    if (!window.confirm('Удалить участника из группы?')) return;
    setRemovingMemberId(memberId);
    try {
      await onRemoveMember(group.id, memberId);
    } catch (err) {
      console.error(err);
      alert('Ошибка при удалении участника');
    } finally {
      setRemovingMemberId(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-md bg-surface-container rounded-[24px] shadow-2xl overflow-hidden"
          >
            <div className="p-5 border-b border-outline-variant flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-on-surface">Управление группой</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container-highest transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-6">
              <div>
                <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3">
                  Участники ({membersList.length})
                </div>
                <div className="space-y-2">
                  {membersList.map((m) => {
                    const isSelf = m.userId === auth.currentUser?.uid;
                    const isRemoving = removingMemberId === m.userId;
                    return (
                      <div key={m.userId} className="flex items-center justify-between p-3 rounded-xl bg-surface-container-high border border-outline-variant">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                            style={{ backgroundColor: m.avatarColor || '#3b82f6' }}
                          >
                            {(m.displayName || m.username || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-on-surface">
                              {m.displayName || m.username} {isSelf && '(Вы)'}
                            </span>
                            <span className="text-xs text-on-surface-variant/80">
                              {m.status === 'accepted' ? 'В группе' : 'Ожидает'}
                            </span>
                          </div>
                        </div>
                        {isCreator && !isSelf && (
                          <button
                            onClick={() => handleRemove(m.userId)}
                            disabled={isRemoving}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                          >
                            {isRemoving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Удалить'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {isCreator && (
                <div className="pt-4 border-t border-outline-variant">
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="w-full px-4 py-3 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Удаление...
                      </>
                    ) : (
                      'Удалить группу полностью'
                    )}
                  </button>
                  <p className="text-center text-[10px] text-on-surface-variant mt-2">
                    Это действие нельзя отменить. Все участники потеряют доступ к группе.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
