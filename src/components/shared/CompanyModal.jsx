import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, Users, Code, PenTool, BrainCircuit, Rocket } from 'lucide-react';
import { useLocale } from '../../i18n.js';

export default function CompanyModal({ isOpen, onClose }) {
  const locale = useLocale();

  if (!isOpen) return null;

  const content = locale === 'ru' ? {
    title: 'О Компании',
    problemTitle: 'Какую проблему мы решаем?',
    problemText: 'В современном мире информации слишком много, а структурированных и персонализированных путей развития — слишком мало. Мы решаем проблему хаотичного обучения, предоставляя вам мощный инструмент на базе ИИ. Наша платформа создает индивидуальные дорожные карты, собирает лучшие материалы и помогает не терять мотивацию на пути к мастерству.',
    teamTitle: 'Наша команда',
    teamText: 'Мы верим, что технологии могут трансформировать образование, сделав его более доступным и интерактивным.',
    devs: [
      {
        name: 'Ivakin Daniil',
        role: 'Co-Founder, CEO & AI Engineer',
        desc: 'Отвечает за стратегию продукта, интеграцию искусственного интеллекта и fullstack-разработку платформы.',
        icon: <BrainCircuit className="w-5 h-5 text-indigo-500" />
      },
      {
        name: 'Dutpayev Adilzhan',
        role: 'Co-Founder, CTO & Backend Engineer',
        desc: 'Руководит технической архитектурой, серверной инфраструктурой и интеграцией с Firebase (Fullstack).',
        icon: <Code className="w-5 h-5 text-blue-500" />
      }
    ],
    close: 'Закрыть'
  } : {
    title: 'About Company',
    problemTitle: 'The Problem We Solve',
    problemText: 'In today\'s world, there is too much information and too few structured, personalized paths for growth. We solve the problem of chaotic learning by providing you with a powerful AI-driven tool. Our platform creates tailored roadmaps, gathers the best resources, and helps you stay motivated on your journey to mastery.',
    teamTitle: 'Our Team',
    teamText: 'We believe that technology can transform education, making it more accessible and interactive.',
    devs: [
      {
        name: 'Ivakin Daniil',
        role: 'Co-Founder, CEO & AI Engineer',
        desc: 'Responsible for product strategy, artificial intelligence integration, and fullstack platform development.',
        icon: <BrainCircuit className="w-5 h-5 text-indigo-500" />
      },
      {
        name: 'Dutpayev Adilzhan',
        role: 'Co-Founder, CTO & Backend Engineer',
        desc: 'Leads the technical architecture, server infrastructure, and Firebase integration (Fullstack).',
        icon: <Code className="w-5 h-5 text-blue-500" />
      }
    ],
    close: 'Close'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/85 backdrop-blur-md"
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
          <div className="flex flex-col gap-8">
            <div className="flex gap-4 items-start">
              <div className="p-3 bg-primary/10 rounded-2xl shrink-0 mt-1">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-clash text-on-surface mb-3">{content.problemTitle}</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">{content.problemText}</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="p-3 bg-secondary/10 rounded-2xl shrink-0 mt-1">
                <Users className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-clash text-on-surface mb-3">{content.teamTitle}</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed mb-4">{content.teamText}</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                  {content.devs.map((dev, idx) => (
                    <motion.div 
                      key={idx}
                      whileHover={{ y: -4, scale: 1.02 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                      className="bg-surface-container-low border border-outline-variant/40 rounded-2xl p-4 flex flex-col gap-2 shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-default relative overflow-hidden group"
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors -mr-12 -mt-12 pointer-events-none"></div>
                      <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 bg-surface rounded-xl shrink-0 shadow-sm">
                          {dev.icon}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-on-surface">{dev.name}</h4>
                          <p className="text-[10px] uppercase font-bold text-primary tracking-wider">{dev.role}</p>
                        </div>
                      </div>
                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        {dev.desc}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-outline flex justify-end flex-shrink-0 bg-surface">
          <button
            onClick={onClose}
            className="bg-on-surface hover:bg-surface-container text-black px-6 py-2 rounded-xl text-xs font-bold transition-colors"
          >
            {content.close}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
