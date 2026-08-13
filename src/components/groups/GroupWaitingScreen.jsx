import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle2, XCircle, AlertTriangle, UserX, UserPlus, Play, Loader2, Users } from 'lucide-react';
import { useLocale } from '../../i18n.js';

export default function GroupWaitingScreen({ 
  group, 
  isCreator, 
  onStartGroup, 
  onRemoveMember, 
  onReplaceMember,
  onDeleteGroup,
  starting,
  error 
}) {
  const locale = useLocale();
  const [timeLeftStr, setTimeLeftStr] = useState('72:00:00');

  useEffect(() => {
    if (!group) return;

    // Timer based on 72h from createdAt
    const createdTime = group.createdAt?.seconds 
      ? group.createdAt.seconds * 1000 
      : Date.now();
    const expiresTime = createdTime + 72 * 60 * 60 * 1000;

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = expiresTime - now;

      if (diff <= 0) {
        setTimeLeftStr(locale === 'en' ? 'Expired' : 'Истёк');
        clearInterval(interval);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeftStr(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [group, locale]);

  if (!group) return null;

  const membersList = Object.values(group.members || {});
  const acceptedCount = membersList.filter(m => m.status === 'accepted').length;
  const allAccepted = acceptedCount === membersList.length;

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-surface-container border border-outline-variant rounded-[24px] shadow-xl font-sans space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-outline-variant pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 font-mono text-[11px] font-bold uppercase tracking-wider border border-amber-500/20">
              {locale === 'en' ? 'Awaiting Confirmation' : 'Ожидание подтверждения'}
            </span>
          </div>
          <h2 className="text-xl font-bold text-on-surface mt-1.5">
            {locale === 'en' ? `Study group for "${group.courseTitle}"` : `Группа по курсу «${group.courseTitle}»`}
          </h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {locale === 'en'
              ? 'The study group starts automatically once all invited peers accept the invitation.'
              : 'Группа стартует автоматически, как только все участники примут приглашение.'}
          </p>
        </div>

        {/* Countdown Timer */}
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-surface-container-high border border-outline-variant font-mono text-xs font-bold text-amber-500">
          <Clock className="w-4 h-4 shrink-0 animate-pulse" />
          <span>TTL: {timeLeftStr}</span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-500 font-medium">
          {error}
        </div>
      )}

      {/* Members List */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">
            {locale === 'en'
              ? `Participant status (${acceptedCount} of ${membersList.length} accepted)`
              : `Статус участников (${acceptedCount} из ${membersList.length} приняли)`}
          </h4>
        </div>

        <div className="space-y-2.5">
          {membersList.map(member => {
            const isSelf = member.userId === group.creatorId;

            return (
              <div 
                key={member.userId} 
                className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant flex items-center justify-between gap-3 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-md shrink-0"
                    style={{ backgroundColor: member.avatarColor || '#3b82f6' }}
                  >
                    {member.displayName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-on-surface truncate">{member.displayName}</p>
                      {isSelf && (
                        <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full border border-primary/20">
                          {locale === 'en' ? 'Creator' : 'Создатель'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-mono text-on-surface-variant truncate">@{member.username}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {/* Status Badge */}
                  {member.status === 'accepted' && (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 font-bold text-xs border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{locale === 'en' ? 'Accepted' : 'Принял(а)'}</span>
                    </span>
                  )}
                  {member.status === 'pending' && (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 font-bold text-xs border border-amber-500/20">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{locale === 'en' ? 'Awaiting response' : 'Ждем ответа'}</span>
                    </span>
                  )}
                  {(member.status === 'declined' || member.status === 'expired') && (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-500 font-bold text-xs border border-red-500/20">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>
                        {member.status === 'declined' 
                          ? (locale === 'en' ? 'Declined' : 'Отклонил(а)') 
                          : (locale === 'en' ? 'Expired TTL' : 'Истёк TTL')}
                      </span>
                    </span>
                  )}

                  {/* Actions for Creator */}
                  {isCreator && !isSelf && (
                    <div className="flex items-center gap-1">
                      {(member.status === 'declined' || member.status === 'expired' || member.status === 'pending') && onReplaceMember && (
                        <button
                          onClick={() => onReplaceMember(member.userId)}
                          className="p-2 rounded-xl text-primary hover:bg-primary/10 transition-colors"
                          title={locale === 'en' ? 'Replace participant' : 'Заменить участника'}
                        >
                          <UserPlus className="w-4 h-4" />
                        </button>
                      )}
                      {onRemoveMember && (
                        <button
                          onClick={() => onRemoveMember(member.userId)}
                          className="p-2 rounded-xl text-on-surface-variant hover:text-red-500 hover:bg-red-500/10 transition-colors"
                          title={locale === 'en' ? 'Remove from group' : 'Удалить из группы'}
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Start / Cancel Action */}
      {isCreator && (
        <div className="pt-4 border-t border-outline-variant flex flex-col sm:flex-row justify-end gap-3">
          {onDeleteGroup && (
            <button
              onClick={onDeleteGroup}
              disabled={starting}
              className="w-full sm:w-auto px-6 py-3 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500/10 font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {locale === 'en' ? 'Cancel Group' : 'Отменить группу'}
            </button>
          )}
          <button
            onClick={onStartGroup}
            disabled={starting || !allAccepted}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {starting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{locale === 'en' ? 'Starting group...' : 'Запуск группы...'}</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>{locale === 'en' ? 'Start Group Now' : 'Стартовать группу сейчас'}</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
