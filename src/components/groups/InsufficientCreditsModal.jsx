import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, UserX, Clock, ArrowUpRight, X } from 'lucide-react';

export default function InsufficientCreditsModal({ 
  isOpen, 
  onClose, 
  insufficientUsers = [], 
  onRemoveUserAndStart, 
  onProposeUpgrade 
}) {
  if (!isOpen || !insufficientUsers || insufficientUsers.length === 0) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg bg-surface-container border border-outline-variant rounded-[24px] shadow-2xl overflow-hidden font-sans flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-outline-variant bg-amber-500/10 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-on-surface text-base">Недостаточно кредитов для старта</h3>
                <p className="text-xs text-on-surface-variant">У участников закончился лимит групповых уроков</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container-highest transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Перед стартом группового урока система проверяет наличие свободных кредитов у всех участников. У следующих пользователей исчерпан лимит на этот месяц:
            </p>

            {/* List of users without credits */}
            <div className="space-y-2.5">
              {insufficientUsers.map(user => (
                <div 
                  key={user.userId} 
                  className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-xs font-bold text-on-surface">{user.displayName || user.username}</p>
                    <p className="text-[11px] font-mono text-on-surface-variant"> Тариф {user.plan || 'FREE'} (исчерпано {user.used || 0} из {user.planLimit || 2})</p>
                  </div>
                  {onRemoveUserAndStart && (
                    <button
                      onClick={() => onRemoveUserAndStart(user.userId)}
                      className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>Убрать из группы</span>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Recommended Options */}
            <div className="space-y-2 pt-2">
              <h5 className="text-xs font-bold text-on-surface uppercase tracking-wider">Выберите вариант действия:</h5>

              <div className="p-3.5 rounded-xl bg-surface-container-high border border-outline-variant space-y-2">
                <div className="flex items-start gap-2.5">
                  <UserX className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-on-surface">1. Убрать участника и стартовать с оставшимися</p>
                    <p className="text-[11px] text-on-surface-variant">Группа начнет обучение сразу без ожидания.</p>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-container-high border border-outline-variant space-y-2">
                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-on-surface">2. Подождать до сброса лимита</p>
                    <p className="text-[11px] text-on-surface-variant">Лимит сбросится с началом нового платёжного месяца у участника.</p>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-container-high border border-outline-variant space-y-2">
                <div className="flex items-start gap-2.5">
                  <ArrowUpRight className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-on-surface">3. Предложить участнику апгрейд тарифа</p>
                    <p className="text-[11px] text-on-surface-variant">При переходе на Pro или Ultra кредиты добавятся мгновенно.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-outline-variant bg-surface-container-low flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-surface-container-highest text-on-surface font-bold text-xs hover:bg-outline-variant transition-colors"
            >
              Закрыть
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
