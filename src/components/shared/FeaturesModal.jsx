import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Map, Network, Trophy, Brain, Zap } from 'lucide-react';
import { useLocale } from '../../i18n.js';

export default function FeaturesModal({ isOpen, onClose }) {
  const locale = useLocale();

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

  if (!isOpen) return null;

  const content = locale === 'ru' ? {
    title: 'Возможности платформы',
    features: [
      {
        icon: <Map className="w-6 h-6 text-blue-500" />,
        title: 'Персональные дорожные карты',
        text: 'ИИ анализирует ваши цели и текущие знания, чтобы построить оптимальный маршрут обучения от новичка до профессионала.'
      },
      {
        icon: <Network className="w-6 h-6 text-purple-500" />,
        title: 'Граф знаний',
        text: 'Визуализируйте свои навыки в виде интерактивного графа, находите пробелы и понимайте связи между различными темами.'
      },
      {
        icon: <Brain className="w-6 h-6 text-pink-500" />,
        title: 'Умное тестирование',
        text: 'Система динамически подбирает вопросы для проверки ваших знаний и автоматического обновления вашего уровня мастерства.'
      },
      {
        icon: <Trophy className="w-6 h-6 text-amber-500" />,
        title: 'Геймификация и лиги',
        text: 'Соревнуйтесь с другими учениками, зарабатывайте опыт (XP), открывайте достижения и продвигайтесь по глобальным лигам.'
      },
      {
        icon: <Zap className="w-6 h-6 text-green-500" />,
        title: 'Актуальный контент',
        text: 'Наша платформа постоянно обновляет рекомендации по курсам и материалам, чтобы вы всегда изучали самые востребованные технологии.'
      }
    ],
    close: 'Понятно'
  } : {
    title: 'Platform Features',
    features: [
      {
        icon: <Map className="w-6 h-6 text-blue-500" />,
        title: 'Personalized Roadmaps',
        text: 'AI analyzes your goals and current knowledge to build the optimal learning path from beginner to professional.'
      },
      {
        icon: <Network className="w-6 h-6 text-purple-500" />,
        title: 'Knowledge Graph',
        text: 'Visualize your skills as an interactive graph, discover gaps, and understand the connections between different topics.'
      },
      {
        icon: <Brain className="w-6 h-6 text-pink-500" />,
        title: 'Smart Testing',
        text: 'The system dynamically selects questions to test your knowledge and automatically updates your mastery level.'
      },
      {
        icon: <Trophy className="w-6 h-6 text-amber-500" />,
        title: 'Gamification & Leagues',
        text: 'Compete with other learners, earn XP, unlock achievements, and climb up the global leagues.'
      },
      {
        icon: <Zap className="w-6 h-6 text-green-500" />,
        title: 'Up-to-date Content',
        text: 'Our platform constantly updates course and material recommendations so you always learn the most in-demand technologies.'
      }
    ],
    close: 'Got it'
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        />

      {/* Modal Dialog */}
      <motion.div
        initial={{ scale: 0.95, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 30, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full max-w-2xl bg-surface border border-outline rounded-[24px] shadow-[0_24px_80px_rgba(0,0,0,0.6)] relative z-10 flex flex-col max-h-[85vh] text-on-background overflow-hidden font-sans"
      >
        {/* Header */}
        <div className="p-5 border-b border-outline flex items-center justify-between flex-shrink-0 bg-surface">
          <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider font-mono">
            {content.title}
          </span>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-container/60 border border-outline-variant transition-colors"
          >
            <X className="w-4 h-4 text-on-surface-variant hover:text-on-surface" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-surface custom-scrollbar">
          <div className="flex flex-col gap-6">
            {content.features.map((feature, index) => (
              <div key={index} className="flex gap-4 items-start p-4 rounded-2xl hover:bg-surface-container/30 transition-colors border border-transparent hover:border-outline-variant/30">
                <div className="p-3 bg-surface-container rounded-2xl shrink-0">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-base font-bold text-on-surface mb-1">{feature.title}</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{feature.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-outline flex justify-end flex-shrink-0 bg-surface">
          <button
            onClick={onClose}
            className="bg-on-surface hover:opacity-90 text-surface px-6 py-2 rounded-xl text-xs font-bold transition-opacity"
          >
            {content.close}
          </button>
        </div>
      </motion.div>
    </div>
  </AnimatePresence>
  );
}
