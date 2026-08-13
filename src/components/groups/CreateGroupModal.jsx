import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, X, UserPlus, Check, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { searchUsersByUsername, createGroup } from '../../services/groupService.js';
import { usePlanLimits } from '../../hooks/usePlanLimits.js';

export default function CreateGroupModal({ isOpen, onClose, courseId, courseTitle, onGroupCreated }) {
  const { groupLessonsRemaining, groupLessonsLimit, checkLimit } = usePlanLimits();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedUsers([]);
      setError('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const users = await searchUsersByUsername(searchQuery.trim());
        setSearchResults(users.filter(u => !selectedUsers.some(s => s.userId === u.userId)));
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedUsers]);

  const handleSelectUser = (user) => {
    if (selectedUsers.length >= 3) {
      setError('Вы можете пригласить максимум 3 человек (всего до 4 участников в группе)');
      return;
    }
    setError('');
    setSelectedUsers(prev => [...prev, user]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveUser = (userId) => {
    setSelectedUsers(prev => prev.filter(u => u.userId !== userId));
  };

  const handleCreateGroup = async () => {
    if (!checkLimit('group_lesson')) return;

    setCreating(true);
    setError('');

    try {
      const invitees = selectedUsers.map(u => ({
        userId: u.userId,
        username: u.username,
        displayName: u.displayName
      }));

      const res = await createGroup(courseId, courseTitle, invitees);
      if (res && res.groupId) {
        if (onGroupCreated) {
          onGroupCreated(res.groupId);
        }
        onClose();
      }
    } catch (err) {
      console.error("Create group error:", err);
      setError(err.message || 'Ошибка при создании группы. Попробуйте снова.');
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg bg-surface-container border border-outline-variant rounded-[24px] shadow-2xl overflow-hidden font-sans flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-on-surface text-lg leading-tight">Пройти с друзьями</h3>
                <p className="text-xs text-on-surface-variant mt-0.5 truncate max-w-[260px]">
                  {courseTitle}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container-highest transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto space-y-5">
            {/* Quota Banner */}
            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/15 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-primary shrink-0" />
                <span className="text-xs font-semibold text-on-surface">Ваш лимит на этот месяц:</span>
              </div>
              <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                осталось {groupLessonsRemaining} из {groupLessonsLimit}
              </span>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2.5 text-xs text-red-500 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* User Search Input */}
            <div>
              <label className="block text-xs font-bold text-on-surface mb-2 uppercase tracking-wider">
                Пригласить участников (до 3 человек)
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск по юзернейму (например, alex)..."
                  className="w-full pl-10 pr-10 py-3 bg-surface-container-high border border-outline-variant rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary transition-colors"
                />
                {searching && (
                  <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />
                )}
              </div>

              {/* Autocomplete Dropdown */}
              {searchResults.length > 0 && (
                <div className="mt-2 bg-surface-container-high border border-outline-variant rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-outline-variant">
                  {searchResults.map(user => (
                    <button
                      key={user.userId}
                      onClick={() => handleSelectUser(user)}
                      className="w-full p-3 flex items-center justify-between hover:bg-surface-container-highest transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-sm"
                          style={{ backgroundColor: user.avatarColor || '#3b82f6' }}
                        >
                          {user.displayName?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-on-surface">{user.displayName}</p>
                          <p className="text-[11px] font-mono text-on-surface-variant">@{user.username}</p>
                        </div>
                      </div>
                      <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <UserPlus className="w-4 h-4" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Users List */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
                  Выбранные участники ({selectedUsers.length + 1} / 4)
                </span>
                <span className="text-[11px] text-on-surface-variant">включая вас</span>
              </div>

              <div className="space-y-2">
                {/* Creator Item */}
                <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                      Вы
                    </div>
                    <div>
                      <p className="text-xs font-bold text-on-surface">Создатель группы (Вы)</p>
                      <p className="text-[10px] font-mono text-emerald-500">Организатор</p>
                    </div>
                  </div>
                  <Check className="w-4 h-4 text-emerald-500" />
                </div>

                {/* Invitees Items */}
                {selectedUsers.map(user => (
                  <div key={user.userId} className="p-3 rounded-xl bg-surface-container-high border border-outline-variant flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-sm"
                        style={{ backgroundColor: user.avatarColor || '#3b82f6' }}
                      >
                        {user.displayName?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-on-surface">{user.displayName}</p>
                        <p className="text-[11px] font-mono text-on-surface-variant">@{user.username}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveUser(user.userId)}
                      className="p-1.5 rounded-lg hover:bg-surface-container-highest text-on-surface-variant hover:text-red-500 transition-colors"
                      title="Убрать"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="p-6 border-t border-outline-variant bg-surface-container-low flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-outline-variant text-on-surface font-semibold text-xs hover:bg-surface-container-highest transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleCreateGroup}
              disabled={creating || groupLessonsRemaining <= 0}
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-bold text-xs shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Создание...</span>
                </>
              ) : (
                <>
                  <Users className="w-4 h-4" />
                  <span>Создать группу {selectedUsers.length > 0 ? `(${selectedUsers.length + 1} чел.)` : ''}</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
