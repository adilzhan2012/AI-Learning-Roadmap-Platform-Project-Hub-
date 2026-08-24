import React from 'react';
import { Trash2 } from 'lucide-react';
import { PLAN_LIMITS } from '../../../constants/planLimits.js';

export default function MentorFooter({
  plan,
  usage,
  isFreeOnboarding,
  onClearHistory,
  locale,
  themeTokens,
}) {
  const totalLimit = plan === 'ULTRA' 
    ? PLAN_LIMITS.ULTRA.aiMentorTokensPerDay 
    : plan === 'PRO'
      ? PLAN_LIMITS.PRO.aiMentorPerDay
      : (isFreeOnboarding ? PLAN_LIMITS.FREE.onboardingMessagesTotal : PLAN_LIMITS.FREE.aiMentorPerDay);

  const currentUsed = plan === 'ULTRA'
    ? (usage.ultraTokensUsed || 0)
    : (usage.mentorMessagesUsed || 0);

  const remaining = Math.max(0, totalLimit - currentUsed);
  const percentRemaining = Math.max(0, Math.min(100, (remaining / totalLimit) * 100));

  return (
    <div className={`px-4 sm:px-6 py-2.5 flex items-center justify-between shrink-0 select-none text-xs ${themeTokens.footerBg}`}>
      {/* Quota & Progress bar */}
      <div className="flex items-center gap-3 max-w-[70%]">
        <div className="flex flex-col gap-1 min-w-[120px]">
          <div className="flex items-center gap-2">
            <span className="text-[11px] sm:text-xs font-medium">
              {locale === 'en' ? 'Daily Limit:' : 'Лимит:'}{' '}
              <strong className="font-bold text-zinc-900 dark:text-zinc-100">
                {plan === 'ULTRA' 
                  ? `${remaining.toLocaleString()} ${locale === 'en' ? 'tokens' : 'токенов'}`
                  : `${remaining} ${locale === 'en' ? 'messages' : 'сообщ.'}${isFreeOnboarding ? (locale === 'en' ? ' (onboarding)' : ' (онбординг)') : ''}`}
              </strong>
            </span>
          </div>

          {/* Thin Progress Bar (3-4px) */}
          <div className={`w-32 sm:w-44 h-1 rounded-full overflow-hidden ${themeTokens.progressBarBg}`}>
            <div 
              className={`h-full rounded-full transition-all duration-500 ${themeTokens.progressBarFill}`}
              style={{ width: `${percentRemaining}%` }}
            />
          </div>
        </div>
      </div>

      {/* Clear History Button */}
      <button 
        type="button"
        onClick={onClearHistory} 
        className="flex items-center gap-1.5 text-[11px] sm:text-xs text-zinc-500 hover:text-rose-500 dark:text-zinc-400 dark:hover:text-rose-400 transition-colors duration-150 py-1 px-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span>{locale === 'en' ? 'Clear history' : 'Очистить историю'}</span>
      </button>
    </div>
  );
}
