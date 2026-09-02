import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  Sun,
  Moon,
  GraduationCap,
  Lightbulb,
  Workflow,
  HelpCircle,
  TrendingUp,
  BarChart3,
  Terminal,
  ExternalLink,
  Laptop,
  Check
} from 'lucide-react';
import { useLocale, setLocale } from '../i18n.js';
import { toggleTheme } from '../theme.js';
import Logo from '../components/shared/Logo.jsx';
import { auth } from '../firebase.js';

export default function About() {
  const locale = useLocale();
  const navigate = useNavigate();
  const isLoggedIn = !!auth.currentUser;
  const isRu = locale === 'ru';

  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return true;
  });

  useEffect(() => {
    window.scrollTo(0, 0);

    const handleThemeChange = (e) => {
      if (e.detail?.theme) {
        setIsDarkTheme(e.detail.theme === 'dark');
      } else {
        setIsDarkTheme(document.documentElement.classList.contains('dark'));
      }
    };

    window.addEventListener('theme:changed', handleThemeChange);
    return () => window.removeEventListener('theme:changed', handleThemeChange);
  }, []);

  const handleToggleTheme = () => {
    toggleTheme();
    setIsDarkTheme(document.documentElement.classList.contains('dark'));
  };

  const handleToggleLocale = () => {
    setLocale(locale === 'ru' ? 'en' : 'ru');
  };

  const stats = [
    { 
      value: '100%', 
      labelRu: 'Персонализация курсов', 
      labelEn: 'Course Personalization', 
      descRu: 'Генерация под любые цели и бэкграунд', 
      descEn: 'Generated for any goal & background',
      icon: BrainCircuit, 
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/20'
    },
    { 
      value: '24/7', 
      labelRu: 'Персональный ИИ-ментор', 
      labelEn: 'Personal AI Mentor', 
      descRu: 'Мгновенный разбор кода и вопросов', 
      descEn: 'Instant code review & Q&A assistance',
      icon: Zap, 
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20'
    },
    { 
      value: '0%', 
      labelRu: 'Ненужной «воды» и теории', 
      labelEn: 'Filler Content & Fluff', 
      descRu: 'Только системные и применимые знания', 
      descEn: 'Only structured and applicable insights',
      icon: Target, 
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20'
    },
    { 
      value: '6', 
      labelRu: 'Соревновательных лиг', 
      labelEn: 'Competitive Leagues', 
      descRu: 'Геймификация, стрики и награды', 
      descEn: 'Gamification, streaks & badges',
      icon: Trophy, 
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/20'
    }
  ];

  const features = [
    {
      icon: BrainCircuit,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      titleRu: 'ИИ-генерация учебных программ',
      titleEn: 'AI Curriculum Generation',
      descRu: 'Вводите любую тему — платформа строит многоуровневый учебный план с проверочными вопросами, практическими уроками и актуальными источниками.',
      descEn: 'Enter any subject — the platform constructs a multi-level curriculum with quizzes, hands-on tasks, and vetted resources.'
    },
    {
      icon: Map,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      titleRu: 'Интерактивный граф знаний',
      titleEn: 'Interactive Knowledge Graph',
      descRu: 'Наглядная 2D/3D визуализация связей между навыками. Видите пререквизиты, открытые узлы и общий прогресс в единой схеме.',
      descEn: 'Visual 2D/3D mapping of skill dependencies. Easily see prerequisites, unlocked milestones, and overall mastery in one connected map.'
    },
    {
      icon: Zap,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      titleRu: 'Контекстный ИИ-наставник',
      titleEn: 'Context-Aware AI Mentor',
      descRu: 'Умный ассистент анализирует контекст текущего урока, объясняет сложные концепции простыми словами и помогает решать ошибки в коде.',
      descEn: 'An intelligent companion analyzes your active lesson context, clarifies tough concepts in plain words, and debugs code errors in real time.'
    },
    {
      icon: Code2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      titleRu: 'Интерактивная практика и квизы',
      titleEn: 'Interactive Practice & Quizzes',
      descRu: 'Каждый теоретический блок закрепляется адаптивными тестами и практическими заданиями с мгновенной автоматической валидацией.',
      descEn: 'Every conceptual chunk is reinforced with adaptive quizzes and interactive homework modules with instant automated feedback.'
    },
    {
      icon: Trophy,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      titleRu: 'Глобальные лиги и геймификация',
      titleEn: 'Global Leagues & Gamification',
      descRu: 'Соревнуйтесь с другими учениками по всему миру в 6 лигах (от Кремния до Титана), поддерживайте ежедневные стрики и получайте XP.',
      descEn: 'Compete globally across 6 leagues (from Silicon to Titan), maintain daily study streaks, and unlock prestigious achievements.'
    },
    {
      icon: Award,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
      titleRu: 'Верифицируемые сертификаты',
      titleEn: 'Verifiable Credentials',
      descRu: 'По окончании курса получайте официальный цифровой сертификат с уникальным хешем для подтверждения в резюме и LinkedIn.',
      descEn: 'Upon finishing a course, receive an official digital certificate with a verifiable ID for resumes and LinkedIn profiles.'
    }
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
      badge: 'v0.1',
      dateRu: 'Начало 2026',
      dateEn: 'Early 2026',
      titleRu: 'Зарождение идеи и первый прототип',
      titleEn: 'The Genesis & First Prototype',
      descRu: 'Основатели платформы столкнулись с проблемой неэффективности самообучения при изучении AI и распределенных систем. Родилась концепция автоматического построения персонализированных образовательных графов.',
      descEn: 'The founders experienced the frustrations of self-learning while studying complex AI and distributed systems. The idea of auto-generating tailored learning graphs was born.'
    },
    {
      badge: 'v0.5',
      dateRu: 'Весна 2026',
      dateEn: 'Spring 2026',
      titleRu: 'Разработка ядра и RAG-архитектуры',
      titleEn: 'Core Engine & RAG Architecture',
      descRu: 'Создание алгоритмов декомпозиции знаний, интеграция передовых LLM-моделей (Google Gemini) и проектирование интерактивной системы графов с сохранением прогресса в реальном времени.',
      descEn: 'Engineered knowledge decomposition algorithms, integrated state-of-the-art LLMs (Google Gemini), and designed the interactive graph system with real-time progress persistence.'
    },
    {
      badge: 'v0.9',
      dateRu: 'Лето 2026',
      dateEn: 'Summer 2026',
      titleRu: 'Геймификация, Лиги и AI-Ментор',
      titleEn: 'Gamification, Leagues & AI Mentor',
      descRu: 'Запуск системы 6 лиг, ежедневных стриков, интерактивных домашних заданий и интеллектуального виджета наставника с глубоким контекстным пониманием уроков.',
      descEn: 'Launched the multi-tier league system, daily streaks, interactive homework modules, and the AI mentor widget with deep contextual lesson understanding.'
    },
    {
      badge: 'v1.1.0',
      dateRu: 'Осень 2026 (Релиз)',
      dateEn: 'Fall 2026 (Release)',
      titleRu: 'Выход в продакшн и глобальное масштабирование',
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
      skills: ['AI / LLM Architecture', 'Fullstack React', 'Product Strategy', 'UI/UX Design', 'Prompt Engineering'],
      initials: 'ДИ',
      avatarBg: 'from-indigo-600 via-purple-600 to-pink-600'
    },
    {
      nameRu: 'Дутпаев Адильжан',
      nameEn: 'Adilzhan Dutpayev',
      roleRu: 'Сооснователь, CTO & Backend Инженер',
      roleEn: 'Co-Founder, CTO & Backend Engineer',
      bioRu: 'Руководит технической инфраструктурой, надежностью данных в Firebase Firestore, безопасностью, масштабируемостью бэкенда и оптимизацией производительности.',
      bioEn: 'Directs technical infrastructure, Firebase Firestore integrity, security, backend scalability, and performance optimization.',
      skills: ['Cloud & Firebase', 'Backend Architecture', 'Security & Rules', 'Database Optimization', 'DevOps & CI/CD'],
      initials: 'ДА',
      avatarBg: 'from-blue-600 via-cyan-600 to-teal-600'
    }
  ];

  const techStack = [
    { name: 'React 18 & Vite', categoryRu: 'Фронтенд', categoryEn: 'Frontend', descRu: 'Высокопроизводительный компонентный интерфейс', descEn: 'High-performance component architecture' },
    { name: 'Google Gemini 2.5', categoryRu: 'Искусственный интеллект', categoryEn: 'AI & LLMs', descRu: 'Интеллектуальная генерация программ и ментор', descEn: 'Curriculum generation & reasoning engine' },
    { name: 'Firebase & Firestore', categoryRu: 'Бэкенд и Базы данных', categoryEn: 'Backend & Data', descRu: 'Realtime БД, аутентификация и облачные сервисы', descEn: 'Realtime database, Auth & Cloud infrastructure' },
    { name: 'Tailwind CSS', categoryRu: 'Стилизация', categoryEn: 'Styling', descRu: 'Токенизированная адаптивная дизайн-система', descEn: 'Token-driven responsive design system' },
    { name: 'Framer Motion', categoryRu: 'Анимации', categoryEn: 'Motion', descRu: 'Плавные физические микро-интеракции', descEn: 'Physics-based fluid micro-interactions' },
    { name: 'Cytoscape / Graph Engine', categoryRu: 'Визуализация', categoryEn: 'Visualization', descRu: 'Интерактивная карта связей и графов знаний', descEn: 'Interactive skill dependency graph canvas' }
  ];

  return (
    <div className="min-h-screen bg-background text-on-background w-full">
      {/* Top Floating Control Bar */}
      <header className="sticky top-0 z-50 w-full bg-surface/80 backdrop-blur-xl border-b border-outline/40 transition-colors">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-8 md:px-12 flex items-center justify-between h-16">
          {/* Left: Back button + Brand */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline/30 text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-all cursor-pointer"
              title={isRu ? 'Вернуться назад' : 'Go back'}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{isRu ? 'Назад' : 'Back'}</span>
            </button>

            <Link to="/" className="flex items-center gap-2.5 group cursor-pointer" title="yourway.co">
              <Logo variant="icon" className="h-8 md:h-9" />
              <span className="font-bold font-clash text-lg sm:text-xl text-on-surface group-hover:text-primary transition-colors">
                yourway.co
              </span>
            </Link>
          </div>

          {/* Center Navigation Anchors */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-on-surface-variant">
            <a href="#about-overview" className="hover:text-primary transition-colors">{isRu ? 'О проекте' : 'Overview'}</a>
            <a href="#mission" className="hover:text-primary transition-colors">{isRu ? 'Миссия' : 'Mission'}</a>
            <a href="#problems" className="hover:text-primary transition-colors">{isRu ? 'Проблема и Решение' : 'Problems & Solutions'}</a>
            <a href="#history" className="hover:text-primary transition-colors">{isRu ? 'История создания' : 'Timeline'}</a>
            <a href="#team" className="hover:text-primary transition-colors">{isRu ? 'Команда' : 'Team'}</a>
            <a href="#tech" className="hover:text-primary transition-colors">{isRu ? 'Стек' : 'Tech'}</a>
          </nav>

          {/* Right Controls: Theme Switch, Language Switch, CTA */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={handleToggleTheme}
              className="p-2 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline/30 text-on-surface-variant hover:text-on-surface transition-all cursor-pointer flex items-center justify-center"
              title={isRu ? (isDarkTheme ? 'Переключить на светлую тему' : 'Переключить на тёмную тему') : (isDarkTheme ? 'Switch to Light mode' : 'Switch to Dark mode')}
            >
              {isDarkTheme ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-500" />
              )}
            </button>

            {/* Language Switch Button */}
            <button
              onClick={handleToggleLocale}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline/30 text-xs font-bold text-on-surface transition-all cursor-pointer select-none"
              title={isRu ? 'Switch to English' : 'Переключить на русский'}
            >
              <Globe className="w-3.5 h-3.5 text-primary" />
              <span>{locale.toUpperCase()}</span>
            </button>

            {/* Dashboard / Login Button */}
            <Link
              to={isLoggedIn ? '/dashboard' : '/login'}
              className="px-4 py-1.5 rounded-xl bg-primary text-on-primary font-semibold text-xs hover:opacity-90 transition-all shadow-sm hidden sm:inline-flex items-center gap-1.5"
            >
              <span>{isLoggedIn ? (isRu ? 'В кабинет' : 'Dashboard') : (isRu ? 'Войти' : 'Sign In')}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Wide Container */}
      <main className="max-w-[1500px] mx-auto px-4 sm:px-8 md:px-12 lg:px-16 py-10 md:py-16">
        
        {/* HERO SECTION */}
        <section className="text-center relative mb-24 lg:mb-32">
          {/* Subtle Ambient Light Glows */}
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none -z-10" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs sm:text-sm font-semibold mb-6 shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isRu ? 'О проекте yourway.co — Образование нового поколения' : 'About yourway.co — Next-Gen AI Learning Ecosystem'}</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight font-sans text-on-surface max-w-5xl mx-auto leading-[1.15]"
          >
            {isRu ? (
              <>
                Интеллектуальная персонализация <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  образования на базе ИИ
                </span>
              </>
            ) : (
              <>
                Intelligent Personalization of <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Next-Gen Education
                </span>
              </>
            )}
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-base sm:text-lg md:text-xl text-on-surface-variant max-w-4xl mx-auto leading-relaxed"
          >
            {isRu 
              ? 'yourway.co — это образовательная среда, объединяющая генеративный искусственный интеллект, интерактивные графы знаний и мотивирующую геймификацию для создания идеального персонального маршрута обучения под цели каждого студента.'
              : 'yourway.co is an educational ecosystem merging generative artificial intelligence, interactive knowledge graphs, and motivational gamification to build the ultimate personalized roadmap tailored for every student.'}
          </motion.p>

          {/* Hero Action Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              to={isLoggedIn ? '/courses' : '/register'}
              className="px-8 py-4 rounded-2xl bg-primary text-on-primary font-bold text-sm sm:text-base hover:opacity-95 transition-all shadow-xl shadow-primary/25 flex items-center gap-2.5 group cursor-pointer"
            >
              <span>{isRu ? 'Начать обучение бесплатно' : 'Start Learning for Free'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#about-overview"
              className="px-8 py-4 rounded-2xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold text-sm sm:text-base border border-outline/30 transition-all cursor-pointer"
            >
              {isRu ? 'Узнать больше о проекте' : 'Explore Platform Features'}
            </a>
          </motion.div>

          {/* Stats Bar (Wide Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-16 max-w-6xl mx-auto">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
                  className={`p-6 rounded-3xl bg-surface-container/60 border ${stat.bg} backdrop-blur-md text-left flex flex-col justify-between shadow-sm hover:scale-[1.02] transition-transform`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl sm:text-4xl font-extrabold font-clash text-on-surface">
                      {stat.value}
                    </span>
                    <div className="p-2.5 rounded-2xl bg-surface-container-high">
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-on-surface">
                      {isRu ? stat.labelRu : stat.labelEn}
                    </h4>
                    <p className="text-xs text-on-surface-variant mt-1">
                      {isRu ? stat.descRu : stat.descEn}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* SECTION: PLATFORM OVERVIEW */}
        <section id="about-overview" className="mb-28 lg:mb-36">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase tracking-wider mb-3">
              <Compass className="w-3.5 h-3.5" />
              <span>{isRu ? 'Возможности платформы' : 'Platform Architecture'}</span>
            </div>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-on-surface font-sans">
              {isRu ? 'Что такое yourway.co?' : 'What Makes yourway.co Unique?'}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-on-surface-variant">
              {isRu 
                ? 'Единая экосистема инструментов, спроектированная для максимальной скорости и глубины освоения любых дисциплин.'
                : 'A unified ecosystem designed from first principles for deep comprehension and rapid skill mastery.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.08 }}
                  className="p-8 rounded-3xl bg-surface-container/50 border border-outline/30 hover:border-primary/50 transition-all flex flex-col justify-between group shadow-sm"
                >
                  <div>
                    <div className={`p-4 rounded-2xl ${feat.bg} ${feat.color} w-fit mb-6 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-7 h-7" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-on-surface mb-3">
                      {isRu ? feat.titleRu : feat.titleEn}
                    </h3>
                    <p className="text-sm text-on-surface-variant leading-relaxed">
                      {isRu ? feat.descRu : feat.descEn}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* SECTION: MISSION & PURPOSE */}
        <section id="mission" className="mb-28 lg:mb-36">
          <div className="p-8 sm:p-12 lg:p-16 rounded-[32px] bg-gradient-to-br from-surface-container via-surface-container/90 to-surface-container-high/40 border border-outline/40 relative overflow-hidden shadow-xl">
            <div className="absolute -right-20 -top-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-7">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-bold uppercase tracking-wider mb-5">
                  <Target className="w-3.5 h-3.5" />
                  <span>{isRu ? 'Миссия и предназначение' : 'Our Mission & Vision'}</span>
                </div>

                <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-on-surface font-sans leading-tight mb-6">
                  {isRu 
                    ? 'Для чего создавался yourway.co?' 
                    : 'Why Was yourway.co Created?'}
                </h2>

                <div className="space-y-4 text-on-surface-variant text-sm sm:text-base leading-relaxed">
                  <p>
                    {isRu 
                      ? 'Главная цель проекта — демократизировать качественное структурированное образование и сделать его адаптивным для каждого жителя планеты. В современном мире каждый человек обладает уникальным бэкграундом, своим темпом восприятия и конкретными карьерными или академическими целями.'
                      : 'Our core purpose is to democratize high-quality, structured education and make it genuinely adaptive for every person worldwide. In modern times, every learner has a distinct background, schedule, and career aspiration.'}
                  </p>
                  <p>
                    {isRu 
                      ? 'Мы создали yourway.co, чтобы исключить недели хаотичного поиска и отсеять неактуальный контент. Достаточно ввести желаемый навык — и передовой ИИ строит прозрачный граф связей от базовых понятий до мастерства.'
                      : 'We engineered yourway.co to eliminate weeks of chaotic searching and weed out obsolete materials. Simply name the skill you wish to master — and state-of-the-art AI generates a transparent concept graph from essentials to mastery.'}
                  </p>
                </div>
              </div>

              {/* Core Pillars (3 Cards) */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                <div className="p-5 rounded-2xl bg-surface/70 border border-outline/30 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <Lightbulb className="w-5 h-5 text-amber-400" />
                    <h4 className="text-base font-bold text-on-surface">
                      {isRu ? 'Точность и глубина' : 'Precision & Depth'}
                    </h4>
                  </div>
                  <p className="text-xs sm:text-sm text-on-surface-variant">
                    {isRu ? 'Строго выверенные уроки без поверхностного пересказа и воды.' : 'Rigorously tailored lessons with zero superficial summaries or fluff.'}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-surface/70 border border-outline/30 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <Workflow className="w-5 h-5 text-indigo-400" />
                    <h4 className="text-base font-bold text-on-surface">
                      {isRu ? 'Связность знаний' : 'Connected Knowledge'}
                    </h4>
                  </div>
                  <p className="text-xs sm:text-sm text-on-surface-variant">
                    {isRu ? 'Граф визуализирует пререквизиты и логическую последовательность тем.' : 'Interactive graphs visually reveal skill prerequisites and logical flow.'}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-surface/70 border border-outline/30 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <Zap className="w-5 h-5 text-emerald-400" />
                    <h4 className="text-base font-bold text-on-surface">
                      {isRu ? 'Практика в фокусе' : 'Practice-First'}
                    </h4>
                  </div>
                  <p className="text-xs sm:text-sm text-on-surface-variant">
                    {isRu ? 'Интерактивные домашние задания и квизы с мгновенной проверкой.' : 'Hands-on assignments, coding challenges, and instant validation.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: PROBLEM VS SOLUTION */}
        <section id="problems" className="mb-28 lg:mb-36">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-bold uppercase tracking-wider mb-3">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{isRu ? 'Проблема и Решение' : 'Challenges & Solutions'}</span>
            </div>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-on-surface font-sans">
              {isRu ? 'Какую проблему решает yourway.co?' : 'What Problem Does yourway.co Solve?'}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-on-surface-variant">
              {isRu 
                ? 'Традиционное онлайн-образование устарело. Мы разобрали главные боли студентов и создали принципиально новое решение.'
                : 'Traditional online learning is broken. We examined the core pain points and built a first-class modern solution.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {problemsAndSolutions.map((item) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4 }}
                  className="rounded-[28px] bg-surface-container/50 border border-outline/30 p-6 sm:p-8 flex flex-col justify-between hover:border-primary/40 transition-all group shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div className="p-3 rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-mono font-bold text-on-surface-variant uppercase tracking-wider">
                        {isRu ? `Вызов #${item.id}` : `Challenge #${item.id}`}
                      </span>
                    </div>

                    {/* Problem Block */}
                    <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/25 mb-4">
                      <h4 className="text-sm sm:text-base font-bold text-rose-400 mb-1.5 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                        <span>{isRu ? item.problemRu : item.problemEn}</span>
                      </h4>
                      <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                        {isRu ? item.problemDescRu : item.problemDescEn}
                      </p>
                    </div>

                    {/* Solution Block */}
                    <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25">
                      <h4 className="text-sm sm:text-base font-bold text-emerald-400 mb-1.5 flex items-center gap-2">
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

        {/* SECTION: TIMELINE & EVOLUTION */}
        <section id="history" className="mb-28 lg:mb-36">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-bold uppercase tracking-wider mb-3">
              <Clock className="w-3.5 h-3.5" />
              <span>{isRu ? 'Хроника создания' : 'Our Evolution'}</span>
            </div>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-on-surface font-sans">
              {isRu ? 'Как создавался этот проект' : 'How the Project Was Built'}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-on-surface-variant">
              {isRu 
                ? 'Путь от смелой инженерной гипотезы до высокопроизводительной платформы с поддержкой сотен тысяч концептов.'
                : 'The journey from a bold technical thesis to a high-throughput platform structuring thousands of concepts.'}
            </p>
          </div>

          <div className="relative border-l-2 border-outline/40 ml-4 sm:ml-8 md:ml-24 lg:ml-32 space-y-12">
            {timelineSteps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="relative pl-8 sm:pl-12 group"
              >
                {/* Dot marker */}
                <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-background border-2 border-primary group-hover:scale-125 group-hover:bg-primary transition-all" />

                <div className="p-6 sm:p-8 rounded-3xl bg-surface-container/50 border border-outline/30 hover:border-primary/40 transition-all shadow-sm">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold font-mono">
                      {isRu ? step.dateRu : step.dateEn}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-surface-container-highest text-[11px] font-mono font-semibold text-on-surface-variant">
                      {step.badge}
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-on-surface mb-2">
                    {isRu ? step.titleRu : step.titleEn}
                  </h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed max-w-4xl">
                    {isRu ? step.descRu : step.descEn}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* SECTION: TEAM */}
        <section id="team" className="mb-28 lg:mb-36">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold uppercase tracking-wider mb-3">
              <Users className="w-3.5 h-3.5" />
              <span>{isRu ? 'Создатели платформы' : 'Founding Team'}</span>
            </div>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-on-surface font-sans">
              {isRu ? 'Команда проекта' : 'Meet the Founders'}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-on-surface-variant">
              {isRu 
                ? 'Инженеры и визионеры, объединенные страстью к искусственному интеллекту и созданию инновационных образовательных инструментов.'
                : 'Engineers and builders passionate about leveraging artificial intelligence to transform education.'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {teamMembers.map((member, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.15 }}
                className="p-8 sm:p-10 rounded-[32px] bg-surface-container/60 border border-outline/40 flex flex-col justify-between hover:border-primary/50 transition-all shadow-lg group"
              >
                <div>
                  <div className="flex items-center gap-5 mb-6">
                    <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr ${member.avatarBg} text-white font-extrabold text-xl sm:text-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform shrink-0`}>
                      {member.initials}
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold text-on-surface">
                        {isRu ? member.nameRu : member.nameEn}
                      </h3>
                      <p className="text-xs sm:text-sm font-semibold text-primary mt-1">
                        {isRu ? member.roleRu : member.roleEn}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-on-surface-variant leading-relaxed mb-8">
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
                        className="px-3 py-1 rounded-xl bg-surface-container-high border border-outline/20 text-xs font-semibold text-on-surface-variant"
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

        {/* SECTION: TECH STACK */}
        <section id="tech" className="mb-24 lg:mb-32">
          <div className="p-8 sm:p-12 lg:p-16 rounded-[32px] bg-surface-container/40 border border-outline/30 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase tracking-wider mb-4">
              <Code2 className="w-3.5 h-3.5" />
              <span>{isRu ? 'Архитектура и Стек' : 'Technology Stack'}</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-on-surface font-sans mb-10">
              {isRu ? 'Технологии, которые движут yourway.co' : 'Technologies Powering yourway.co'}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
              {techStack.map((tech, i) => (
                <div key={i} className="p-6 rounded-2xl bg-surface/70 border border-outline/25 flex flex-col justify-between hover:border-primary/40 transition-all shadow-sm">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold text-primary uppercase tracking-wider">
                        {isRu ? tech.categoryRu : tech.categoryEn}
                      </span>
                    </div>
                    <span className="font-bold text-base sm:text-lg text-on-surface block font-sans">
                      {tech.name}
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm text-on-surface-variant mt-3">
                    {isRu ? tech.descRu : tech.descEn}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* BOTTOM CTA BANNER */}
        <section className="mb-8">
          <div className="p-8 sm:p-12 lg:p-16 rounded-[36px] bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-950 border border-indigo-500/30 text-center relative overflow-hidden shadow-2xl">
            <div className="max-w-3xl mx-auto relative z-10">
              <Logo variant="icon" className="h-14 w-14 mx-auto mb-6" />
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white font-sans mb-5">
                {isRu ? 'Готовы построить свой персональный маршрут?' : 'Ready to Build Your Personalized Learning Journey?'}
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-indigo-200/80 mb-10 leading-relaxed">
                {isRu 
                  ? 'Сформулируйте свою цель прямо сейчас и получите интерактивную дорожную карту с поддержкой персонального ИИ-наставника.'
                  : 'Specify your goal right now and get an interactive roadmap powered by your personal AI mentor.'}
              </p>
              <Link
                to={isLoggedIn ? '/courses' : '/register'}
                className="inline-flex items-center gap-2.5 px-9 py-4 rounded-2xl bg-white text-indigo-950 font-bold text-sm sm:text-base hover:bg-indigo-50 transition-all shadow-xl hover:scale-105 cursor-pointer"
              >
                <span>{isRu ? 'Начать обучение бесплатно' : 'Start Learning for Free'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
