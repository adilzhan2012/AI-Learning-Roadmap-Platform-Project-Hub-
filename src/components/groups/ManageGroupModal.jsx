import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Loader2, AlertTriangle } from 'lucide-react';
import { auth } from '../../firebase.js';
import { useLocale } from '../../i18n.js';

export default function ManageGroupModal({
  isOpen,
  onClose,
  group,
  onRemoveMember,
  onDeleteGroup
}) {
  const locale = useLocale();
  const [isDeleting, setIsDeleting] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Handle ESC and safe body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen || !group) return null;

  const isCreator = group.creatorId === auth.currentUser?.uid;
  const membersList = Object.values(group.members || {});

  const handleDelete = async () => {
    setIsDeleting(true);
    setErrorMessage('');
    try {
      await onDeleteGroup(group.id);
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMessage(locale === 'en' ? 'Failed to delete study group' : 'Ошибка при удалении группы');
    } finally {
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleRemove = async (memberId) => {
    setRemovingMemberId(memberId);
    setErrorMessage('');
    try {
      await onRemoveMember(group.id, memberId);
    } catch (err) {
      console.error(err);
      setErrorMessage(locale === 'en' ? 'Failed to remove participant' : 'Ошибка при удалении участника');
    } finally {
      setRemovingMemberId(null);
      setConfirmRemoveId(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
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
                <h2 className="font-bold text-on-surface">
                  {locale === 'en' ? 'Manage Study Group' : 'Управление группой'}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container-highest transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-6">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex justify-between items-center">
                  <span>{errorMessage}</span>
                  <button onClick={() => setErrorMessage('')} className="hover:text-red-200">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div>
                <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3">
                  {locale === 'en' ? `Participants (${membersList.length})` : `Участники (${membersList.length})`}
                </div>
                <div className="space-y-2">
                  {membersList.map((m) => {
                    const isSelf = m.userId === auth.currentUser?.uid;
                    const isRemoving = removingMemberId === m.userId;
                    const isConfirmingRemove = confirmRemoveId === m.userId;
                    return (
                      <div key={m.userId} className="flex items-center justify-between p-3 rounded-xl bg-surface-container-high border border-outline-variant">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                            style={{ backgroundColor: m.avatarColor || '#3b82f6' }}
                          >
                            {(m.displayName || m.username || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold text-on-surface truncate">
                              {m.displayName || m.username} {isSelf && (locale === 'en' ? '(You)' : '(Вы)')}
                            </span>
                            <span className="text-xs text-on-surface-variant/80">
                              {m.status === 'accepted' 
                                ? (locale === 'en' ? 'In Group' : 'В группе') 
                                : (locale === 'en' ? 'Pending' : 'Ожидает')}
                            </span>
                          </div>
                        </div>
                        {isCreator && !isSelf && (
                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            {isConfirmingRemove ? (
                              <>
                                <button
                                  onClick={() => handleRemove(m.userId)}
                                  disabled={isRemoving}
                                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-500 text-white hover:bg-red-600 transition-colors"
                                >
                                  {isRemoving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (locale === 'en' ? 'Yes' : 'Да')}
                                </button>
                                <button
                                  onClick={() => setConfirmRemoveId(null)}
                                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-surface-container border border-outline-variant text-zinc-300 hover:bg-surface-container-highest transition-colors"
                                >
                                  {locale === 'en' ? 'No' : 'Нет'}
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => setConfirmRemoveId(m.userId)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors"
                              >
                                {locale === 'en' ? 'Remove' : 'Удалить'}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {isCreator && (
                <div className="pt-4 border-t border-outline-variant">
                  {confirmDelete ? (
                    <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-center space-y-3">
                      <p className="text-xs text-red-400 font-bold">
                        {locale === 'en' ? 'Permanently delete this group?' : 'Точно удалить эту группу?'}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={handleDelete}
                          disabled={isDeleting}
                          className="flex-1 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                        >
                          {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (locale === 'en' ? 'Yes, Delete' : 'Да, удалить')}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(false)}
                          disabled={isDeleting}
                          className="flex-1 py-2 rounded-lg bg-surface-container border border-outline-variant text-zinc-300 font-bold text-xs hover:bg-surface-container-highest transition-colors"
                        >
                          {locale === 'en' ? 'Cancel' : 'Отмена'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="w-full px-4 py-3 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
                    >
                      {locale === 'en' ? 'Delete Group Permanently' : 'Удалить группу полностью'}
                    </button>
                  )}
                  <p className="text-center text-[10px] text-on-surface-variant mt-2">
                    {locale === 'en'
                      ? 'This action cannot be undone. All members will lose access to this group.'
                      : 'Это действие нельзя отменить. Все участники потеряют доступ к группе.'}
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
