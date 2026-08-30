import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ShieldAlert, Check, X, AlertTriangle, KeyRound } from 'lucide-react';
import { t, useLocale } from '../../i18n.js';
import { calculatePasswordStrength } from '../../utils/passwordValidator.js';

/**
 * Modern NIST SP 800-63B Password Strength Meter & Checklist Component
 */
export default function PasswordStrengthMeter({
  password,
  context = {},
  isCheckingBreach = false,
  breachFound = false,
  showRulesList = true
}) {
  const locale = useLocale();
  const strength = calculatePasswordStrength(password, context);

  if (!password) {
    if (!showRulesList) return null;
    return (
      <div className="mt-3 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 text-xs space-y-2">
        <div className="flex items-center gap-2 font-semibold text-zinc-700 dark:text-zinc-300">
          <KeyRound className="w-4 h-4 text-indigo-500" />
          <span>{t('auth.passwordRules.title')}</span>
        </div>
        <ul className="space-y-1.5 text-zinc-500 dark:text-zinc-400 pl-1">
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600 shrink-0" />
            <span>{t('auth.passwordRules.minLength')}</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600 shrink-0" />
            <span>{t('auth.passwordRules.noPersonalInfo')}</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600 shrink-0" />
            <span>{t('auth.passwordRules.noSequences')}</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600 shrink-0" />
            <span>{t('auth.passwordRules.unicodeSupported')}</span>
          </li>
        </ul>
      </div>
    );
  }

  const lengthOk = password.length >= 12 && password.length <= 128;
  const noPersonal = strength.personalViolations.length === 0;
  const noSeq = !strength.hasSequence;

  return (
    <div className="mt-3 space-y-3">
      {/* Visual Progress Bar & Score */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 font-medium">
            {strength.score >= 3 ? (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
            )}
            {locale === 'ru' ? 'Надёжность:' : 'Strength:'}
          </span>
          <span className={`font-bold ${strength.textColor}`}>
            {t(strength.labelKey)}
          </span>
        </div>

        {/* 4-segment progress indicator */}
        <div className="grid grid-cols-4 gap-1.5 h-1.5">
          {[1, 2, 3, 4].map((seg) => {
            const isFilled = strength.score >= seg;
            return (
              <div
                key={seg}
                className={`h-full rounded-full transition-all duration-300 ${
                  isFilled ? strength.color : 'bg-zinc-200 dark:bg-zinc-800'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Breach Alert from HaveIBeenPwned */}
      <AnimatePresence>
        {breachFound && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-start gap-2"
          >
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-snug">{t('auth.passwordRules.compromised')}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Real-time Validation Checklist */}
      {showRulesList && (
        <div className="p-3 rounded-2xl bg-zinc-50/70 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/60 text-xs space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
            <span>{t('auth.passwordRules.title')}</span>
            {isCheckingBreach && (
              <span className="text-indigo-500 lowercase animate-pulse">
                {locale === 'ru' ? 'проверка утечек...' : 'checking breaches...'}
              </span>
            )}
          </div>

          <div className={`flex items-center gap-2 ${lengthOk ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-zinc-500 dark:text-zinc-400'}`}>
            {lengthOk ? <Check className="w-3.5 h-3.5 shrink-0 text-emerald-500" /> : <X className="w-3.5 h-3.5 shrink-0 text-zinc-400" />}
            <span>{t('auth.passwordRules.minLength')} ({password.length}/12)</span>
          </div>

          <div className={`flex items-center gap-2 ${noPersonal ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-amber-600 dark:text-amber-400 font-medium'}`}>
            {noPersonal ? <Check className="w-3.5 h-3.5 shrink-0 text-emerald-500" /> : <X className="w-3.5 h-3.5 shrink-0 text-amber-500" />}
            <span>{t('auth.passwordRules.noPersonalInfo')}</span>
          </div>

          <div className={`flex items-center gap-2 ${noSeq ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-amber-600 dark:text-amber-400 font-medium'}`}>
            {noSeq ? <Check className="w-3.5 h-3.5 shrink-0 text-emerald-500" /> : <X className="w-3.5 h-3.5 shrink-0 text-amber-500" />}
            <span>{t('auth.passwordRules.noSequences')}</span>
          </div>
        </div>
      )}
    </div>
  );
}
