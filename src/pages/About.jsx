import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  BrainCircuit, 
  Compass, 
  Map, 
  Target, 
  Users, 
  Code2, 
  Rocket, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Clock, 
  Flame, 
  Trophy, 
  BookOpen, 
  Zap, 
  Award, 
  Cpu, 
  Layers, 
  Globe, 
  ChevronRight,
  ArrowLeft,
  GraduationCap,
  Lightbulb,
  Workflow,
  HelpCircle,
  TrendingUp,
  BarChart3,
  Terminal,
  ExternalLink
} from 'lucide-react';
import { useLocale } from '../i18n.js';
import Logo from '../components/shared/Logo.jsx';
import { auth } from '../firebase.js';

export default function About() {
  const locale = useLocale();
  const navigate = useNavigate();
  const isLoggedIn = !!auth.currentUser;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const isRu = locale === 'ru';

  const stats = [
    { value: '100%', labelRu: 'Персонализация курсов', labelEn: 'Course Personalization', icon: BrainCircuit, color: 'text-indigo-400' },
    { value: '24/7', labelRu: 'Персональный ИИ-ментор', labelEn: 'Personal AI Mentor', icon: Zap, color: 'text-amber-400' },
    { value: '0%', labelRu: 'Ненужной «воды» и теории', labelEn: 'Filler Content & Fluff', icon: Target, color: 'text-emerald-400' },
    { value: '6', labelRu: 'Соревновательных лиг', labelEn: 'Competitive Leagues', icon: Trophy, color: 'text-purple-400' }
  ];

  const problemsAndSolutions = [
    {
      id: 1,
      icon: Layers,
      problemRu: 'Информационный хаос и перегруз',
      problemEn: 'Information Chaos & Overload',
      problemDescRu: 'Тысячи случайных видео на YouTube, разрозненные статьи и устаревшие учебники не дают целостной картины. Ученик тратит до 70% времени на поиск того, что учить дальше.',
      problemDescEn: 'Thousands of random YouTube videos, scattered articles, and outdated textbooks fail to give a coherent picture. Students spend up to 70% of their time just searching for what to study next.',
      solutionRu: 'Интеллектуальный граф знаний и роадмап',
      solutionEn: 'AI Knowledge Graph & Dynamic Roadmap',
      solutionDescRu: 'yourway.co декомпозирует любую сложную цель в структурированный граф понятий. Вы видите свой маршрут от точки А до точки Б без слепых пятен.',
      solutionDescEn: 'yourway.co decomposes any ambitious goal into a structured concept graph. You clearly see your learning path from Point A to Point B with zero blind spots.'
    },
    {
      id: 2,
      icon: Flame,
      problemRu: 'Синдром брошенных курсов (90%+ отсева)',
      problemEn: 'The 90%+ Drop-off Rate Problem',
      problemDescRu: 'Традиционные онлайн-курсы монотонны. Без внешней поддержки и динамического вовлечения большинство студентов теряют интерес уже на второй неделе.',
      problemDescEn: 'Traditional online courses are monotonous and isolating. Without feedback loops and engagement, most students lose motivation within two weeks.',
      solutionRu: 'Геймификация, лиги и поддержка стриков',
      solutionEn: 'Gamified Leagues, Streaks & Motivation',
      solutionDescRu: 'Система лиг (от Кремния до Титана), стрики ежедневных занятий, XP и моментальные достижения превращают рутину в увлекательную игру.',
      solutionDescEn: 'Our multi-tier league system (Silicon to Titan), daily streaks, XP mechanics, and instant achievements turn daily learning into an exciting game.'
    },
    {
      id: 3,
      icon: BrainCircuit,
      problemRu: 'Отсутствие быстрой помощи и наставника',
      problemEn: 'Lack of Real-Time Mentorship',
      problemDescRu: 'Когда студент застревает на непонятной строке кода или сложной формуле, приходится ждать ответа преподавателя часами или днями.',
      problemDescEn: 'When stuck on a confusing concept, code bug, or complex formula, students often wait hours or days for an instructor to reply.',
      solutionRu: 'Круглосуточный адаптивный ИИ-ментор',
      solutionEn: '24/7 Context-Aware AI Mentor',
      solutionDescRu: 'Встроенный ИИ-наставник знает контекст вашего текущего урока, разбирает домашние задания, подсказывает решения и объясняет сложные вещи на пальцах.',
      solutionDescEn: 'An integrated AI mentor understands the exact context of your current lesson, checks homework, gives hints, and simplifies complicated concepts instantly.'
    },
    {
      id: 4,
      icon: Cpu,
      problemRu: 'Шаблонные программы «для всех одинаково»',
      problemEn: 'One-Size-Fits-All Static Curricula',
      problemDescRu: 'Обычные курсы записаны раз и навсегда. Они заставляют новичка скучать на базовых темах или бросают сразу в сложный материал без фундамента.',
      problemDescEn: 'Pre-recorded courses cannot adapt. They either bore experienced learners with basics or overwhelm beginners without sufficient foundation.',
      solutionRu: 'Генерация курсов под ваш личный уровень',
      solutionEn: 'On-Demand Dynamic Course Generation',
      solutionDescRu: 'ИИ оценивает ваши цели, текущий багаж знаний и генерирует уникальную программу с интерактивными квизами и практикой специально для вас.',
      solutionDescEn: 'AI evaluates your specific objectives, current background, and generates a personalized curriculum with quizzes tailored exactly for you.'
    }
  ];

  const timelineSteps = [
    {
      dateRu: 'Начало 2026',
      dateEn: 'Early 2026',
      titleRu: 'Зарождение идеи и прототип',
      titleEn: 'The Genesis & First Prototype',
      descRu: 'Основатели платформы столкнулись с проблемой неэффективности самообучения при изучении AI и распределенных систем. Родилась идея создания системы, которая автоматически строит персонализированные образовательные графы.',
      descEn: 'The founders experienced the frustrations of self-learning while studying complex AI and distributed systems. The idea of auto-generating tailored learning graphs was born.'
    },
    {
      dateRu: 'Весна 2026',
      dateEn: 'Spring 2026',
      titleRu: 'Разработка ядра и RAG-архитектуры',
      titleEn: 'Core Engine & RAG Architecture',
      descRu: 'Создание алгоритмов декомпозиции знаний, интеграция передовых LLM-моделей (Google Gemini) и проектирование интерактивной системы графов с сохранением прогресса в реальном времени.',
      descEn: 'Engineered knowledge decomposition algorithms, integrated state-of-the-art LLMs (Google Gemini), and designed the interactive graph system with real-time progress persistence.'
    },
    {
      dateRu: 'Лето 2026',
      dateEn: 'Summer 2026',
      titleRu: 'Геймификация, Лиги и AI-Ментор',
      titleEn: 'Gamification, Leagues & AI Mentor',
      descRu: 'Запуск системы лиг, ежедневных стриков, интерактивных домашних заданий и интеллектуального виджета наставника с глубоким контекстным пониманием уроков.',
      descEn: 'Launched the multi-tier league system, daily streaks, interactive homework modules, and the AI mentor widget with deep contextual lesson understanding.'
    },
    {
      dateRu: 'Осень 2026 (Релиз v1.1.0)',
      dateEn: 'Fall 2026 (Release v1.1.0)',
      titleRu: 'Выход в продакшн и масштабирование',
      titleEn: 'Production Release & Global Scale',
      descRu: 'Полноценный запуск платформы yourway.co с поддержкой верификации сертификатов, гибкой системы тарифов, темного/светлого интерфейса и мультиязычности.',
      descEn: 'Full-scale production release of yourway.co featuring verified credentials, flexible plans, seamless dark/light modes, and full bilingual support.'
    }
  ];

  const teamMembers = [
    {
      nameRu: 'Ивакин Даниил',
      nameEn: 'Daniil Ivakin',
      roleRu: 'Сооснователь, CEO & AI Инженер',
      roleEn: 'Co-Founder, CEO & AI Engineer',
      bioRu: 'Отвечает за общее видение продукта, архитектуру искусственного интеллекта, пользовательский опыт (UI/UX), интеграцию LLM и fullstack-разработку платформы.',
      bioEn: 'Leads product vision, AI architecture, UI/UX design, LLM integration, and fullstack platform development.',
      skills: ['AI / LLM Architecture', 'Fullstack React', 'Product Strategy', 'UI/UX Design'],
      initials: 'ДИ',
      avatarBg: 'from-indigo-600 to-violet-600'
    },
    {
      nameRu: 'Дутпаев Адильжан',
      nameEn: 'Adilzhan Dutpayev',
      roleRu: 'Сооснователь, CTO & Backend Инженер',
      roleEn: 'Co-Founder, CTO & Backend Engineer',
      bioRu: 'Руководит технической инфраструктурой, надежностью данных в Firebase Firestore, безопасностью, масштабируемостью бэкенда и оптимизацией производительности.',
      bioEn: 'Directs technical infrastructure, Firebase Firestore integrity, security, backend scalability, and performance optimization.',
      skills: ['Cloud & Firebase', 'Backend Architecture', 'Security & Rules', 'Database Optimization'],
      initials: 'ДА',
      avatarBg: 'from-blue-600 to-cyan-600'
    }
  ];

  const techStack = [
    { name: 'React 18', descRu: 'Компонентный UI нового поколения', descEn: 'Modern UI framework' },
    { name: 'Google Gemini AI', descRu: 'Интеллектуальная генерация программ и ментор', descEn: 'Course generation & AI reasoning' },
    { name: 'Firebase & Firestore', descRu: 'Realtime БД, Auth и Cloud Functions', descEn: 'Realtime database, Auth & Hosting' },
    { name: 'Tailwind CSS', descRu: 'Дизайн-система со строгими токенами', descEn: 'Token-based design system' },
    { name: 'Framer Motion', descRu: 'Плавные микро-анимации и переходы', descEn: 'Smooth physics-based animations' },
    { name: 'Knowledge Graph Engine', descRu: 'Интерактивная карта связей навыков', descEn: 'Interactive skill dependency graph' }
  ];

  return (
    <div className="min-h-screen bg-background text-on-background py-6 md:py-10">
      {/* Top Breadcrumb / Back button */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-8 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-surface-container-low hover:bg-surface-container border border-outline/30 text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isRu ? 'Назад' : 'Back'}</span>
        </button>

        <Link
          to={isLoggedIn ? '/dashboard' : '/'}
          className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
        >
          <span>{isLoggedIn ? (isRu ? 'В личный кабинет' : 'To Dashboard') : (isRu ? 'На главную' : 'To Home')}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-20 text-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs sm:text-sm font-semibold mb-6 shadow-sm"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isRu ? 'О проекте yourway.co' : 'About yourway.co'}</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight font-sans text-on-surface max-w-4xl mx-auto leading-tight"
        >
          {isRu 
            ? 'Интеллектуальная персонализация образования нового поколения' 
            : 'Next-Generation AI Personalized Learning Platform'}
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6 text-base sm:text-lg md:text-xl text-on-surface-variant max-w-3xl mx-auto leading-relaxed"
        >
          {isRu 
            ? 'yourway.co — это образовательная среда, объединяющая генеративный искусственный интеллект, интерактивные графы знаний и увлекательную геймификацию для создания идеального маршрута обучения под каждого студента.'
            : 'yourway.co is an educational ecosystem merging generative artificial intelligence, interactive knowledge graphs, and engaging gamification to build the ultimate personalized learning path for every student.'}
        </motion.p>

        {/* CTA buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-4"
        >
          <Link
            to={isLoggedIn ? '/courses' : '/register'}
            className="px-6 py-3 rounded-xl bg-primary text-on-primary font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 group cursor-pointer"
          >
            <span>{isRu ? 'Начать обучение бесплатно' : 'Start Learning Free'}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a
            href="#history"
            className="px-6 py-3 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-semibold text-sm border border-outline/30 transition-all cursor-pointer"
          >
            {isRu ? 'История создания' : 'Our Story'}
          </a>
        </motion.div>

        {/* Key Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mt-16 max-w-5xl mx-auto">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
                className="p-5 rounded-2xl bg-surface-container/60 border border-outline/30 backdrop-blur-sm text-center flex flex-col items-center justify-center"
              >
                <div className="p-2 rounded-xl bg-surface-container-high mb-3">
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div className="text-2xl sm:text-3xl font-bold font-clash text-on-surface">
                  {stat.value}
                </div>
                <div className="text-xs text-on-surface-variant font-medium mt-1">
                  {isRu ? stat.labelRu : stat.labelEn}
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Mission & Purpose Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-24">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-surface-container via-surface-container/80 to-surface-container-high/40 border border-outline/40 relative overflow-hidden shadow-xl">
          <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-bold uppercase tracking-wider mb-4">
              <Target className="w-3.5 h-3.5" />
              <span>{isRu ? 'Миссия и цель проекта' : 'Our Mission & Vision'}</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-bold text-on-surface font-sans leading-tight mb-6">
              {isRu 
                ? 'Для чего создавался yourway.co?' 
                : 'Why Was yourway.co Created?'}
            </h2>

            <div className="space-y-4 text-on-surface-variant text-sm sm:text-base leading-relaxed">
              <p>
                {isRu 
                  ? 'Главная цель проекта — демократизировать качественное образование и сделать его по-настоящему адаптивным. В современном мире каждый человек учится в своем уникальном контексте, со своими фоновыми знаниями и целями.'
                  : 'Our core purpose is to democratize high-quality education and make it genuinely adaptive. In the modern era, every learner starts from a unique background, schedule, and aspiration.'}
              </p>
              <p>
                {isRu 
                  ? 'Мы создали yourway.co, чтобы любой студент, разработчик или энтузиаст мог за пару кликов сформулировать любую цель — от «Освоить React с нуля» до «Понять квантовые вычисления» — и получить выверенный структурированный план без необходимости тратить недели на поиск разрозненных материалов.'
                  : 'We built yourway.co so that any student, developer, or curious thinker can state any learning goal — from "Master React from scratch" to "Understand Quantum Computing" — and immediately get a pristine roadmap without wasting weeks curating scattered resources.'}
              </p>
            </div>

            {/* Core Values Bullet Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
              <div className="p-4 rounded-2xl bg-surface/60 border border-outline/30">
                <Lightbulb className="w-6 h-6 text-amber-400 mb-2" />
                <h4 className="text-sm font-bold text-on-surface mb-1">
                  {isRu ? 'Точность и глубина' : 'Precision & Depth'}
                </h4>
                <p className="text-xs text-on-surface-variant">
                  {isRu ? 'Структурированные шаги без поверхностного пересказа' : 'Rigorously structured steps with no superficial summaries'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-surface/60 border border-outline/30">
                <Workflow className="w-6 h-6 text-indigo-400 mb-2" />
                <h4 className="text-sm font-bold text-on-surface mb-1">
                  {isRu ? 'Связность знаний' : 'Connected Knowledge'}
                </h4>
                <p className="text-xs text-on-surface-variant">
                  {isRu ? 'Граф показывает зависимости тем и путь развития' : 'Visual graphs revealing exact skill prerequisites and flow'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-surface/60 border border-outline/30">
                <Zap className="w-6 h-6 text-emerald-400 mb-2" />
                <h4 className="text-sm font-bold text-on-surface mb-1">
                  {isRu ? 'Практика в фокусе' : 'Practice-First'}
                </h4>
                <p className="text-xs text-on-surface-variant">
                  {isRu ? 'Квизы, задачи и разбор кода на каждом этапе' : 'Interactive quizzes, assignments, and immediate AI code review'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problems & Solutions Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-24">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-bold uppercase tracking-wider mb-3">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{isRu ? 'Проблема и Решение' : 'Problem vs Solution'}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold text-on-surface font-sans">
            {isRu ? 'Какую проблему решает yourway.co?' : 'What Problem Does yourway.co Solve?'}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-on-surface-variant">
            {isRu 
              ? 'Традиционное обучение сломано: оно либо слишком хаотично, либо негибко. Мы переосмыслили каждый шаг процесса.'
              : 'Traditional online education is broken: either chaotic or rigid. We re-engineered every layer of the learning experience.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {problemsAndSolutions.map((item) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="rounded-3xl bg-surface-container/40 border border-outline/30 p-6 sm:p-8 flex flex-col justify-between hover:border-primary/40 transition-all group"
              >
                <div>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-3 rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-mono font-bold text-on-surface-variant uppercase tracking-wider">
                      {isRu ? `Вызов #${item.id}` : `Challenge #${item.id}`}
                    </span>
                  </div>

                  {/* Problem Block */}
                  <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 mb-4">
                    <h4 className="text-sm font-bold text-rose-400 mb-1 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                      <span>{isRu ? item.problemRu : item.problemEn}</span>
                    </h4>
                    <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                      {isRu ? item.problemDescRu : item.problemDescEn}
                    </p>
                  </div>

                  {/* Solution Block */}
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                    <h4 className="text-sm font-bold text-emerald-400 mb-1 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{isRu ? item.solutionRu : item.solutionEn}</span>
                    </h4>
                    <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                      {isRu ? item.solutionDescRu : item.solutionDescEn}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Story & History Section */}
      <section id="history" className="max-w-6xl mx-auto px-4 sm:px-6 mb-24">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-bold uppercase tracking-wider mb-3">
            <Clock className="w-3.5 h-3.5" />
            <span>{isRu ? 'Хроника создания' : 'The Evolution'}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold text-on-surface font-sans">
            {isRu ? 'Как создавался этот проект' : 'How the Project Was Built'}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-on-surface-variant">
            {isRu 
              ? 'Путь от смелой инженерной гипотезы до высокопроизводительной платформы с интерактивными графами и ИИ-наставником.'
              : 'The journey from a bold engineering hypothesis to a high-throughput platform mapping thousands of concepts.'}
          </p>
        </div>

        <div className="relative border-l-2 border-outline/40 ml-4 sm:ml-8 md:ml-32 space-y-12">
          {timelineSteps.map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="relative pl-8 sm:pl-10 group"
            >
              {/* Dot on line */}
              <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-background border-2 border-primary group-hover:scale-125 group-hover:bg-primary transition-all" />

              <div className="p-6 rounded-2xl bg-surface-container/50 border border-outline/30 hover:border-primary/40 transition-all">
                <span className="inline-block px-3 py-1 rounded-md bg-primary/10 text-primary text-xs font-bold font-mono mb-2">
                  {isRu ? step.dateRu : step.dateEn}
                </span>
                <h3 className="text-lg font-bold text-on-surface mb-2">
                  {isRu ? step.titleRu : step.titleEn}
                </h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  {isRu ? step.descRu : step.descEn}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Team Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-24">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold uppercase tracking-wider mb-3">
            <Users className="w-3.5 h-3.5" />
            <span>{isRu ? 'Создатели платформы' : 'Core Team'}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold text-on-surface font-sans">
            {isRu ? 'Команда проекта' : 'Meet the Team'}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-on-surface-variant">
            {isRu 
              ? 'Инженеры и визионеры, увлеченные преобразованием образования через силу искусственного интеллекта.'
              : 'Engineers and visionaries passionate about revolutionizing learning through the power of AI.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {teamMembers.map((member, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.15 }}
              className="p-8 rounded-3xl bg-surface-container/60 border border-outline/40 flex flex-col justify-between hover:border-primary/50 transition-all shadow-lg"
            >
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${member.avatarBg} text-white font-bold text-xl flex items-center justify-center shadow-lg`}>
                    {member.initials}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-on-surface">
                      {isRu ? member.nameRu : member.nameEn}
                    </h3>
                    <p className="text-xs font-semibold text-primary mt-0.5">
                      {isRu ? member.roleRu : member.roleEn}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
                  {isRu ? member.bioRu : member.bioEn}
                </p>
              </div>

              <div>
                <div className="text-xs font-mono font-bold text-on-surface-variant/70 uppercase tracking-wider mb-3">
                  {isRu ? 'Ключевые компетенции' : 'Core Domains'}
                </div>
                <div className="flex flex-wrap gap-2">
                  {member.skills.map((skill, sIdx) => (
                    <span 
                      key={sIdx}
                      className="px-2.5 py-1 rounded-lg bg-surface-container-high border border-outline/20 text-xs font-medium text-on-surface-variant"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-24">
        <div className="p-8 sm:p-10 rounded-3xl bg-surface-container/40 border border-outline/30 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase tracking-wider mb-4">
            <Code2 className="w-3.5 h-3.5" />
            <span>{isRu ? 'Архитектура и Стек' : 'Tech Stack'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-on-surface font-sans mb-8">
            {isRu ? 'Технологии, которые движут yourway.co' : 'Technologies Powering yourway.co'}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-left">
            {techStack.map((tech, i) => (
              <div key={i} className="p-4 rounded-2xl bg-surface/60 border border-outline/20 flex flex-col justify-between">
                <span className="font-bold text-sm text-on-surface font-mono">{tech.name}</span>
                <span className="text-xs text-on-surface-variant mt-1">
                  {isRu ? tech.descRu : tech.descEn}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-12">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-indigo-900/60 border border-indigo-500/30 text-center relative overflow-hidden shadow-2xl">
          <div className="max-w-2xl mx-auto relative z-10">
            <Logo variant="icon" className="h-12 w-12 mx-auto mb-4" />
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white font-sans mb-4">
              {isRu ? 'Готовы построить свой путь в будущее?' : 'Ready to Build Your Path to the Future?'}
            </h2>
            <p className="text-sm sm:text-base text-indigo-200/80 mb-8">
              {isRu 
                ? 'Создайте свой первый персонализированный курс прямо сейчас и начните учиться быстрее и эффективнее.'
                : 'Generate your first personalized roadmap right now and start learning faster with your private AI mentor.'}
            </p>
            <Link
              to={isLoggedIn ? '/courses' : '/register'}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-indigo-950 font-bold text-sm hover:bg-indigo-50 transition-all shadow-lg hover:scale-105 cursor-pointer"
            >
              <span>{isRu ? 'Начать прямо сейчас' : 'Get Started Now'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
