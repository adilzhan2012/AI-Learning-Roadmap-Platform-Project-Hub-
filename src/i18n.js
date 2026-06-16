// ============================================
// i18n — Internationalization System
// ============================================

const locales = {
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.courses': 'Courses',
    'nav.resources': 'Resources',
    'nav.insights': 'Insights',
    'nav.graph': 'Knowledge Graph',
    'nav.settings': 'Settings',
    'nav.darkMode': 'Dark Mode',
    'nav.lightMode': 'Light Mode',
    'nav.premiumLearner': 'Premium Learner',

    // Top Bar
    'topbar.search': 'Search...',

    // Dashboard
    'dashboard.welcome': 'Welcome back, Alex',
    'dashboard.subtitle': "You've completed 3 lessons this week. Keep the momentum going!",
    'dashboard.continueLearning': 'Continue Learning',
    'dashboard.stats.courses': 'Courses Enrolled',
    'dashboard.stats.hours': 'Hours Learned',
    'dashboard.stats.certs': 'Certificates',
    'dashboard.stats.streak': 'Day Streak',
    'dashboard.recentActivity': 'Recent Activity',
    'dashboard.weeklyGoal': 'Weekly Goal',
    'dashboard.daysActive': 'Days Active',

    // Courses
    'courses.title': 'Explore Courses',
    'courses.subtitle': 'Master AI with expert-led courses designed for every skill level.',
    'courses.search': 'Search courses...',
    'courses.enrollNow': 'Enroll Now',
    'courses.enrolled': 'Enrolled!',
    'courses.completed': 'Completed',
    'courses.complete': 'complete',
    'courses.students': 'students',
    'courses.lessons': 'lessons',
    'courses.filterAll': 'All',

    // Resources
    'resources.title': 'Learning Resources',
    'resources.subtitle': 'Curated materials to accelerate your AI learning journey.',
    'resources.featured': 'Featured',
    'resources.readNow': 'Read Now',
    'resources.tabs.all': 'All',
    'resources.tabs.articles': 'Articles',
    'resources.tabs.videos': 'Videos',
    'resources.tabs.cheatsheets': 'Cheat Sheets',
    'resources.tabs.repos': 'Repositories',

    // Insights
    'insights.title': 'Your Learning Insights',
    'insights.subtitle': 'Track your progress and identify areas for growth.',
    'insights.thisWeek': 'This Week',
    'insights.thisMonth': 'This Month',
    'insights.allTime': 'All Time',
    'insights.totalHours': 'Total Hours',
    'insights.coursesActive': 'Courses Active',
    'insights.completionRate': 'Completion Rate',
    'insights.avgQuiz': 'Avg Quiz Score',
    'insights.weeklyActivity': 'Weekly Activity',
    'insights.overallProgress': 'Overall Progress',
    'insights.courseProgress': 'Course Progress',
    'insights.achievements': 'Achievements',
    'insights.viewAll': 'View All',

    // Knowledge Graph
    'graph.title': 'Knowledge Graph',
    'graph.subtitle': 'Explore how courses connect and build upon each other.',
    'graph.zoomIn': 'Zoom In',
    'graph.zoomOut': 'Zoom Out',
    'graph.resetView': 'Reset View',
    'graph.prerequisites': 'Prerequisites',
    'graph.leadsTo': 'Leads to',
    'graph.difficulty': 'Difficulty',
    'graph.clickToExplore': 'Click a node to explore connections',

    // Settings
    'settings.title': 'Settings',
    'settings.subtitle': 'Manage your account preferences and configurations.',
    'settings.nav.profile': 'Profile',
    'settings.nav.localization': 'Language & Region',
    'settings.nav.billing': 'Subscriptions & Billing',
    'settings.nav.preferences': 'Preferences',
    'settings.nav.about': 'About',

    // Settings — Profile
    'settings.profile.title': 'Profile Settings',
    'settings.profile.subtitle': 'Update your personal information and profile details.',
    'settings.profile.photo': 'Profile Photo',
    'settings.profile.photoHint': 'Recommended: 200×200px, JPG or PNG',
    'settings.profile.change': 'Change',
    'settings.profile.remove': 'Remove',
    'settings.profile.legalName': 'Legal Name',
    'settings.profile.firstName': 'First Name',
    'settings.profile.lastName': 'Last Name',
    'settings.profile.email': 'Email Address',
    'settings.profile.verified': 'Verified',
    'settings.profile.bio': 'Bio',
    'settings.profile.cancel': 'Cancel',
    'settings.profile.save': 'Save Changes',
    'settings.profile.saved': 'Settings saved successfully',

    // Settings — Localization
    'settings.locale.title': 'Language & Region',
    'settings.locale.subtitle': 'Customize your language and regional preferences.',
    'settings.locale.interfaceLang': 'Interface Language',
    'settings.locale.interfaceLangDesc': 'Select the language for the app interface.',
    'settings.locale.contentLang': 'Content Language',
    'settings.locale.contentLangDesc': 'Preferred language for course content and subtitles.',
    'settings.locale.timezone': 'Timezone',
    'settings.locale.timezoneDesc': 'Used for scheduling and activity timestamps.',

    // Settings — Billing
    'settings.billing.title': 'Subscriptions & Billing',
    'settings.billing.subtitle': 'Manage your plan, payment methods, and invoices.',
    'settings.billing.currentPlan': 'Current Plan',
    'settings.billing.premium': 'Premium',
    'settings.billing.perMonth': '/month',
    'settings.billing.renewsOn': 'Renews on',
    'settings.billing.changePlan': 'Change Plan',
    'settings.billing.cancelSub': 'Cancel Subscription',
    'settings.billing.paymentMethod': 'Payment Method',
    'settings.billing.invoices': 'Recent Invoices',
    'settings.billing.paid': 'Paid',
    'settings.billing.download': 'Download',

    // Settings — Preferences
    'settings.prefs.title': 'Preferences',
    'settings.prefs.subtitle': 'Configure display, notifications, and workspace settings.',
    'settings.prefs.appearance': 'Appearance',
    'settings.prefs.darkMode': 'Dark Mode',
    'settings.prefs.darkModeDesc': 'Switch between light and dark theme.',
    'settings.prefs.reducedMotion': 'Reduced Motion',
    'settings.prefs.reducedMotionDesc': 'Minimize animations for accessibility.',
    'settings.prefs.notifications': 'Notifications',
    'settings.prefs.weeklyDigest': 'Weekly Digest',
    'settings.prefs.weeklyDigestDesc': 'Receive a weekly email with your learning progress.',
    'settings.prefs.courseAnnouncements': 'Course Announcements',
    'settings.prefs.courseAnnouncementsDesc': 'Get notified when new courses are added.',
    'settings.prefs.pushNotifications': 'Push Notifications',
    'settings.prefs.pushNotificationsDesc': 'Receive browser push notifications.',
    'settings.prefs.workspace': 'Workspace',
    'settings.prefs.codeEditor': 'Code Editor Theme',
    'settings.prefs.codeEditorDesc': 'Choose your preferred code editor style.',
    'settings.prefs.autoSave': 'Auto-save Progress',
    'settings.prefs.autoSaveDesc': 'Automatically save your course progress.',

    // Connected Accounts
    'settings.connected': 'Connected Accounts',
    'settings.connected.github': 'GitHub',
    'settings.connected.google': 'Google',
    'settings.connected.connectedAs': 'Connected as',
    'settings.connected.notConnected': 'Not connected',
    'settings.connected.disconnect': 'Disconnect',
    'settings.connected.connect': 'Connect',

    // Courses Catalog
    'course.1.title': 'Introduction to AI',
    'course.1.desc': 'Learn the foundational concepts of artificial intelligence, history, and basic terminology.',
    'course.2.title': 'Machine Learning Fundamentals',
    'course.2.desc': 'Dive into supervised and unsupervised learning, regressions, classification models, and algorithms.',
    'course.3.title': 'Neural Networks Deep Dive',
    'course.3.desc': 'Understand artificial neural networks, backpropagation, and training deep learning models.',
    'course.4.title': 'NLP with Transformers',
    'course.4.desc': 'Explore natural language processing techniques, tokenization, and state-of-the-art Transformer architectures.',
    'course.5.title': 'Computer Vision Fundamentals',
    'course.5.desc': 'Learn to process images, apply convolutions, and build models for object detection and classification.',
    'course.6.title': 'Reinforcement Learning',
    'course.6.desc': 'Master Markov decision processes, Q-learning, policy gradients, and decision making under uncertainty.',
    'course.7.title': 'GANs & Generative AI',
    'course.7.desc': 'Learn about Generative Adversarial Networks, image generation, autoencoders, and diffusion models.',
    'course.8.title': 'AI Ethics & Governance',
    'course.8.desc': 'Analyze bias in AI, ethical frameworks, privacy, regulations, and responsible deployment models.',
    'course.9.title': 'MLOps & Deployment',
    'course.9.desc': 'Bridge the gap between model development and deployment. Setup pipelines, monitoring, and scaling.',
  },

  kk: {
    'nav.dashboard': 'Басты бет',
    'nav.courses': 'Курстар',
    'nav.resources': 'Ресурстар',
    'nav.insights': 'Аналитика',
    'nav.graph': 'Білім графигі',
    'nav.settings': 'Баптаулар',
    'nav.darkMode': 'Қараңғы режим',
    'nav.lightMode': 'Жарық режим',
    'nav.premiumLearner': 'Премиум оқушы',
    'topbar.search': 'Іздеу...',
    'courses.title': 'Курстарды зерттеу',
    'courses.subtitle': 'Барлық деңгейге арналған сарапшылар жетекшілігімен AI-ды меңгеріңіз.',
    'courses.search': 'Курстарды іздеу...',
    'courses.enrollNow': 'Тіркелу',
    'courses.enrolled': 'Тіркелдіңіз!',
    'courses.completed': 'Аяқталды',
    'courses.complete': 'аяқталды',
    'courses.students': 'студенттер',
    'courses.lessons': 'сабақтар',
    'courses.filterAll': 'Барлығы',
    'settings.title': 'Баптаулар',
    'settings.subtitle': 'Аккаунт параметрлерін басқару.',
    'settings.nav.profile': 'Профиль',
    'settings.nav.localization': 'Тіл және аймақ',
    'settings.nav.billing': 'Жазылымдар',
    'settings.nav.preferences': 'Параметрлер',
    'settings.nav.about': 'Ақпарат',
    'settings.profile.title': 'Профиль баптаулары',
    'settings.profile.subtitle': 'Жеке ақпаратыңызды жаңартыңыз.',
    'settings.profile.firstName': 'Аты',
    'settings.profile.lastName': 'Тегі',
    'settings.profile.email': 'Электрондық пошта',
    'settings.profile.bio': 'Өмірбаян',
    'settings.profile.cancel': 'Бас тарту',
    'settings.profile.save': 'Сақтау',
    'settings.profile.saved': 'Баптаулар сақталды',
    'graph.title': 'Білім графигі',
    'graph.subtitle': 'Курстар арасындағы байланыстарды зерттеңіз.',
  },

  ru: {
    'nav.dashboard': 'Главная',
    'nav.courses': 'Курсы',
    'nav.resources': 'Ресурсы',
    'nav.insights': 'Аналитика',
    'nav.graph': 'Граф знаний',
    'nav.settings': 'Настройки',
    'nav.darkMode': 'Тёмная тема',
    'nav.lightMode': 'Светлая тема',
    'nav.premiumLearner': 'Премиум',
    'topbar.search': 'Поиск...',
    'courses.title': 'Каталог курсов',
    'courses.subtitle': 'Освойте ИИ с экспертами — курсы для любого уровня.',
    'courses.search': 'Поиск курсов...',
    'courses.enrollNow': 'Записаться',
    'courses.enrolled': 'Записаны!',
    'courses.completed': 'Завершено',
    'courses.complete': 'завершено',
    'courses.students': 'студентов',
    'courses.lessons': 'уроков',
    'courses.filterAll': 'Все',
    'settings.title': 'Настройки',
    'settings.subtitle': 'Управление аккаунтом и конфигурацией.',
    'settings.nav.profile': 'Профиль',
    'settings.nav.localization': 'Язык и регион',
    'settings.nav.billing': 'Подписки и оплата',
    'settings.nav.preferences': 'Предпочтения',
    'settings.nav.about': 'О приложении',
    'settings.profile.title': 'Настройки профиля',
    'settings.profile.subtitle': 'Обновите личную информацию.',
    'settings.profile.firstName': 'Имя',
    'settings.profile.lastName': 'Фамилия',
    'settings.profile.email': 'Электронная почта',
    'settings.profile.bio': 'О себе',
    'settings.profile.cancel': 'Отмена',
    'settings.profile.save': 'Сохранить',
    'settings.profile.saved': 'Настройки сохранены',
    'graph.title': 'Граф знаний',
    'graph.subtitle': 'Исследуйте связи между курсами.',

    // Courses Catalog
    'course.1.title': 'Введение в ИИ',
    'course.1.desc': 'Изучите основные концепции искусственного интеллекта, его историю и базовую терминологию.',
    'course.2.title': 'Основы Машинного Обучения',
    'course.2.desc': 'Погрузитесь в обучение с учителем и без учителя, регрессии, модели классификации и алгоритмы.',
    'course.3.title': 'Глубокое изучение Нейронных Сетей',
    'course.3.desc': 'Поймите устройство искусственных нейронных сетей, обратное распространение ошибки и обучение моделей.',
    'course.4.title': 'NLP с Трансформерами',
    'course.4.desc': 'Изучите методы обработки естественного языка, токенизацию и современные архитектуры Трансформеров.',
    'course.5.title': 'Основы Компьютерного Зрения',
    'course.5.desc': 'Научитесь обрабатывать изображения, применять свертки и создавать модели для обнаружения объектов.',
    'course.6.title': 'Обучение с Подкреплением',
    'course.6.desc': 'Освойте марковские процессы принятия решений, Q-обучение и принятие решений в условиях неопределенности.',
    'course.7.title': 'GAN и Генеративный ИИ',
    'course.7.desc': 'Узнайте о генеративно-состязательных сетях, генерации изображений, автоэнкодерах и диффузионных моделях.',
    'course.8.title': 'Этика и Управление ИИ',
    'course.8.desc': 'Проанализируйте предвзятость в ИИ, этические рамки, конфиденциальность и ответственные модели развертывания.',
    'course.9.title': 'MLOps и Развертывание',
    'course.9.desc': 'Преодолейте разрыв между разработкой модели и ее развертыванием. Настройте конвейеры и мониторинг.',

    // Direct string translations for DB matches
    'Introduction to AI': 'Введение в ИИ',
    'Learn the foundational concepts of artificial intelligence, history, and basic terminology.': 'Изучите основные концепции искусственного интеллекта, его историю и базовую терминологию.',
    'Machine Learning Fundamentals': 'Основы Машинного Обучения',
    'Dive into supervised and unsupervised learning, regressions, classification models, and algorithms.': 'Погрузитесь в обучение с учителем и без учителя, регрессии, модели классификации и алгоритмы.',
    'Neural Networks Deep Dive': 'Глубокое изучение Нейронных Сетей',
    'Understand artificial neural networks, backpropagation, and training deep learning models.': 'Поймите устройство искусственных нейронных сетей, обратное распространение ошибки и обучение моделей.',
    'NLP with Transformers': 'NLP с Трансформерами',
    'Explore natural language processing techniques, tokenization, and state-of-the-art Transformer architectures.': 'Изучите методы обработки естественного языка, токенизацию и современные архитектуры Трансформеров.',
    'Computer Vision Fundamentals': 'Основы Компьютерного Зрения',
    'Learn to process images, apply convolutions, and build models for object detection and classification.': 'Научитесь обрабатывать изображения, применять свертки и создавать модели для обнаружения объектов.',
    'Reinforcement Learning': 'Обучение с Подкреплением',
    'Master Markov decision processes, Q-learning, policy gradients, and decision making under uncertainty.': 'Освойте марковские процессы принятия решений, Q-обучение и принятие решений в условиях неопределенности.',
    'GANs & Generative AI': 'GAN и Генеративный ИИ',
    'Learn about Generative Adversarial Networks, image generation, autoencoders, and diffusion models.': 'Узнайте о генеративно-состязательных сетях, генерации изображений, автоэнкодерах и диффузионных моделях.',
    'AI Ethics & Governance': 'Этика и Управление ИИ',
    'Analyze bias in AI, ethical frameworks, privacy, regulations, and responsible deployment models.': 'Проанализируйте предвзятость в ИИ, этические рамки, конфиденциальность и ответственные модели развертывания.',
    'MLOps & Deployment': 'MLOps и Развертывание',
    'Bridge the gap between model development and deployment. Setup pipelines, monitoring, and scaling.': 'Преодолейте разрыв между разработкой модели и ее развертыванием. Настройте конвейеры и мониторинг.',
  },

  zh: {
    'nav.dashboard': '仪表板',
    'nav.courses': '课程',
    'nav.resources': '资源',
    'nav.insights': '分析',
    'nav.graph': '知识图谱',
    'nav.settings': '设置',
    'nav.darkMode': '深色模式',
    'nav.lightMode': '浅色模式',
    'nav.premiumLearner': '高级学员',
    'topbar.search': '搜索...',
    'courses.title': '探索课程',
    'courses.subtitle': '通过专家指导的课程掌握AI技术。',
    'courses.search': '搜索课程...',
    'courses.enrollNow': '立即报名',
    'courses.enrolled': '已报名！',
    'courses.completed': '已完成',
    'courses.complete': '完成',
    'courses.students': '学生',
    'courses.lessons': '课',
    'courses.filterAll': '全部',
    'settings.title': '设置',
    'settings.subtitle': '管理您的账户偏好和配置。',
    'settings.nav.profile': '个人资料',
    'settings.nav.localization': '语言和地区',
    'settings.nav.billing': '订阅和账单',
    'settings.nav.preferences': '偏好设置',
    'settings.nav.about': '关于',
    'settings.profile.title': '个人资料设置',
    'settings.profile.subtitle': '更新您的个人信息。',
    'settings.profile.firstName': '名',
    'settings.profile.lastName': '姓',
    'settings.profile.email': '电子邮箱',
    'settings.profile.bio': '简介',
    'settings.profile.cancel': '取消',
    'settings.profile.save': '保存更改',
    'settings.profile.saved': '设置已保存',
    'graph.title': '知识图谱',
    'graph.subtitle': '探索课程之间的联系。',
  },
};

const STORAGE_KEY = 'ai-academy-locale';
let currentLocale = localStorage.getItem(STORAGE_KEY) || 'en';

/**
 * Translate a key to the current locale. Falls back to English.
 * @param {string} key - dot-notation locale key
 * @param {Object} [params] - optional interpolation params {name: 'Alex'} → {{name}}
 * @returns {string}
 */
export function t(key, params = {}) {
  let str = (locales[currentLocale] && locales[currentLocale][key])
          || locales.en[key]
          || key;
  // Simple interpolation: {{name}} → params.name
  Object.entries(params).forEach(([k, v]) => {
    str = str.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v);
  });
  return str;
}

export function getLocale() {
  return currentLocale;
}

export function setLocale(locale) {
  if (locales[locale]) {
    currentLocale = locale;
    localStorage.setItem(STORAGE_KEY, locale);
    // Dispatch event so the app can re-render
    window.dispatchEvent(new CustomEvent('locale:changed', { detail: { locale } }));
  }
}

export function getAvailableLocales() {
  return [
    { code: 'en', label: 'English (US)', flag: '🇺🇸' },
    { code: 'kk', label: 'Қазақша', flag: '🇰🇿' },
    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
    { code: 'zh', label: '中文 (HSK 1)', flag: '🇨🇳' },
  ];
}

import { useState, useEffect } from 'react';

export function useLocale() {
  const [locale, setLocaleState] = useState(currentLocale);
  useEffect(() => {
    const handler = (e) => setLocaleState(e.detail.locale);
    window.addEventListener('locale:changed', handler);
    return () => window.removeEventListener('locale:changed', handler);
  }, []);
  return locale;
}
