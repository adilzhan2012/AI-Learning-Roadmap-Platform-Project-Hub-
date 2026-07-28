import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Activity, Terminal } from 'lucide-react';
import Logo from '../components/shared/Logo.jsx';
import { auth } from '../firebase.js';

const floatVariants = {
  animate: {
    y: [0, -20, 0],
    transition: {
      duration: 5,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
};

const fadeUpVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: 'spring', damping: 25, stiffness: 100 }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

export default function Landing() {
  const isLoggedIn = !!auth.currentUser;

  return (
    <div className="dark min-h-screen bg-background text-on-background font-sans overflow-x-hidden selection:bg-primary-container w-full relative">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div 
          variants={floatVariants}
          animate="animate"
          className="absolute top-[20%] left-[20%] w-[600px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full mix-blend-screen"
        />
        <motion.div 
          variants={floatVariants}
          animate="animate"
          style={{ animationDelay: '-2s' }}
          className="absolute top-[40%] right-[10%] w-[500px] h-[500px] bg-indigo-500/10 blur-[100px] rounded-full mix-blend-screen"
        />
      </div>

      {/* Minimal Nav */}
      <motion.nav 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="fixed top-0 w-full z-50 bg-surface/60 backdrop-blur-xl border-b border-outline transition-all duration-300"
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/">
            <Logo variant="full" className="h-8" />
          </Link>
          <div>
            {isLoggedIn ? (
              <Link to="/dashboard">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-sm font-medium bg-primary text-on-primary px-4 py-2 rounded-full inline-block shadow-lg"
                >
                  Go to Dashboard
                </motion.button>
              </Link>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/login" className="text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors">Log in</Link>
                <Link to="/register">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="text-sm font-medium bg-primary text-on-primary px-4 py-2 rounded-full inline-block shadow-lg"
                  >
                    Sign up
                  </motion.button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </motion.nav>

      {/* Hero Interactive Dashboard Wrapper */}
      <main className="relative pt-24 pb-12 md:pt-40 md:pb-32 px-4 sm:px-6 flex flex-col items-center justify-center text-center z-10 min-h-screen">
        
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="max-w-7xl mx-auto w-full flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-16 text-left"
        >
          {/* Left Text & Action Area */}
          <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left">
            <motion.h1 variants={fadeUpVariants} className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-4 md:mb-6 leading-tight">
              <span className="text-on-surface">
                yourway.co
              </span>
            </motion.h1>
            <motion.p variants={fadeUpVariants} className="text-lg sm:text-xl md:text-2xl text-on-surface-variant max-w-2xl mb-8 md:mb-10 font-light">
              An intelligent, immersive environment to track, learn, and master your technical roadmap.
            </motion.p>
            
            <motion.div variants={fadeUpVariants} className="flex flex-col sm:flex-row items-center gap-4 mb-8 w-full sm:w-auto">
              {isLoggedIn ? (
                <Link to="/dashboard" className="w-full sm:w-auto">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full sm:w-auto justify-center px-8 py-4 rounded-full bg-primary text-on-primary font-semibold text-lg shadow-xl flex items-center gap-2"
                  >
                    Enter Workspace <ArrowRight className="w-5 h-5" />
                  </motion.button>
                </Link>
              ) : (
                <Link to="/register" className="w-full sm:w-auto">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full sm:w-auto justify-center px-8 py-4 rounded-full bg-primary text-on-primary font-semibold text-lg shadow-xl flex items-center gap-2"
                  >
                    Start Learning Now <Activity className="w-5 h-5" />
                  </motion.button>
                </Link>
              )}
            </motion.div>
          </div>

          {/* Right Square Hero PNG Logo Container */}
          <motion.div 
            variants={fadeUpVariants}
            className="w-72 h-72 sm:w-80 sm:h-80 md:w-[380px] md:h-[380px] lg:w-[420px] lg:h-[420px] aspect-square flex-shrink-0 flex items-center justify-center"
          >
            <img 
              src="/logo-icon-dark.png" 
              alt="yourway.co Logo" 
              className="w-full h-full object-contain object-center" 
            />
          </motion.div>

          {/* Interactive Glassmorphism Dashboard Preview */}
          <motion.div 
            variants={fadeUpVariants}
            className="relative w-full aspect-video rounded-[2.5rem] overflow-hidden bg-surface-container backdrop-blur-xl border border-outline shadow-2xl group cursor-pointer card-hover"
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            
            {/* Mock Dashboard UI Inside */}
            <div className="absolute inset-4 rounded-[1.5rem] bg-surface border border-outline-variant flex flex-col overflow-hidden">
              <div className="h-12 border-b border-outline-variant flex items-center px-6 gap-4">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                </div>
                <div className="flex-1 h-6 bg-on-surface/5 rounded-full flex items-center justify-center">
                  <span className="text-xs text-neutral-500 font-mono tracking-wider">platform.projecthub.ai</span>
                </div>
              </div>
              <div className="flex-1 p-8 flex items-center justify-center">
                <div className="text-center">
                   <motion.div 
                     animate={{ rotate: 360 }} 
                     transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                     className="inline-block mb-4"
                   >
                     <Terminal className="w-16 h-16 text-primary/30 group-hover:text-primary/60 transition-colors duration-500" />
                   </motion.div>
                   <p className="text-on-surface-variant font-medium tracking-wide uppercase text-sm">Interactive Knowledge Graph Interface</p>
                </div>
              </div>
            </div>
            
            {/* Click overlay to redirect */}
            <Link to={isLoggedIn ? "/dashboard" : "/register"} className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-background/40 backdrop-blur-sm">
              <motion.span 
                initial={{ y: 20 }}
                whileInView={{ y: 0 }}
                className="px-6 py-3 rounded-full bg-primary text-on-primary font-semibold shadow-xl flex items-center gap-2"
              >
                Launch Environment <ArrowRight className="w-4 h-4" />
              </motion.span>
            </Link>
          </motion.div>

        </motion.div>
      </main>

      {/* Overview & Vision Section */}
      <section className="relative py-16 md:py-24 px-4 sm:px-6 z-10 bg-surface-container-lowest border-t border-outline">
        <div className="max-w-7xl mx-auto flex flex-col gap-16 md:gap-24">
          
          {/* Beta Release Notification */}
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            className="w-full max-w-3xl mx-auto relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-purple-500/30 to-primary/30 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-50 group-hover:opacity-100" />
            <div className="relative bg-surface-container/80 backdrop-blur-2xl border border-primary/30 p-6 md:p-8 rounded-3xl flex flex-col sm:flex-row items-center gap-6 shadow-[0_0_40px_rgba(var(--color-primary),0.2)]">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-3xl shadow-lg shadow-primary/20 flex-shrink-0">
                🚀
              </div>
              <div className="text-center sm:text-left flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-3">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  Public Beta Live
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-on-surface mb-2">Добро пожаловать в бета-версию!</h3>
                <p className="text-on-surface-variant text-sm md:text-base leading-relaxed">
                  Мы запустили публичную бету платформы. Сейчас доступен базовый функционал, генерация курсов и граф знаний. Возможны небольшие баги, но мы активно работаем над их устранением.
                </p>
              </div>
            </div>
          </motion.div>

          <div className="text-center max-w-4xl mx-auto">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-4xl md:text-6xl font-bold mb-6 md:mb-8 text-primary"
            >
              Обзор Платформы
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-on-surface-variant text-base sm:text-lg md:text-2xl font-light leading-relaxed px-2"
            >
              Мы создали этот проект, чтобы решить проблему хаотичного самообразования. С помощью ИИ-сгенерированных дорожных карт мы помогаем учащимся легко осваивать сложные технические дисциплины, избегая "tutorial hell" (ада туториалов). 
            </motion.p>
          </div>

          {/* Interactive Feature Cards */}
          <div className="grid md:grid-cols-2 gap-6 md:gap-8 w-full px-2">
            {[
              {
                title: "Интерактивный Граф Знаний",
                desc: "Визуализируйте свой путь обучения. Наш динамичный граф показывает зависимости и связи между курсами для идеального понимания структуры.",
                icon: "🕸️",
                color: "from-emerald-500/20 to-teal-500/20",
                borderColor: "group-hover:border-emerald-500/50"
              },
              {
                title: "Уроки от ИИ (Groq)",
                desc: "Платформа генерирует подробные, актуальные и интерактивные уроки на лету с помощью высокопроизводительных ИИ-моделей.",
                icon: "🧠",
                color: "from-blue-500/20 to-indigo-500/20",
                borderColor: "group-hover:border-blue-500/50"
              },
              {
                title: "Языковая Поддержка",
                desc: "В данный момент платформа полностью доступна на русском языке. В ближайшем будущем планируется масштабное обновление с поддержкой английского языка.",
                icon: "🌍",
                color: "from-purple-500/20 to-fuchsia-500/20",
                borderColor: "group-hover:border-purple-500/50"
              },
              {
                title: "Геймификация и Прогресс",
                desc: "Следите за своими ежедневными сериями, получайте достижения и соревнуйтесь в лигах для поддержания мотивации.",
                icon: "🏆",
                color: "from-orange-500/20 to-amber-500/20",
                borderColor: "group-hover:border-orange-500/50"
              }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ scale: 1.02, y: -5 }}
                className={`group relative overflow-hidden rounded-[1.5rem] md:rounded-[2rem] bg-surface-container backdrop-blur-xl border border-outline-variant p-6 md:p-8 transition-all duration-300 ${feature.borderColor}`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="relative z-10 flex flex-col h-full">
                  <div className="text-4xl md:text-5xl mb-4 md:mb-6 transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 origin-left">{feature.icon}</div>
                  <h3 className="text-xl md:text-2xl font-bold text-on-surface mb-3 md:mb-4 transition-all">{feature.title}</h3>
                  <p className="text-on-surface-variant text-base md:text-lg leading-relaxed flex-1">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Founders Section */}
          <div className="mt-8 md:mt-12 text-center px-2">
             <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-4xl md:text-5xl font-bold mb-8 md:mb-12 text-on-surface"
            >
              Команда Проекта
            </motion.h2>
            <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto w-full">
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.03 }}
                className="group bg-surface-container border border-outline-variant rounded-[1.5rem] md:rounded-[2rem] p-6 sm:p-10 text-left relative overflow-hidden backdrop-blur-xl transition-all duration-500 hover:shadow-[0_0_40px_rgba(59,130,246,0.2)] hover:border-blue-500/40"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] -mr-32 -mt-32 transition-opacity group-hover:opacity-100 opacity-50" />
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-6 sm:mb-8 relative z-10 text-center sm:text-left">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg group-hover:shadow-blue-500/50 transition-shadow">
                    DI
                  </div>
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-on-surface mb-1">Ивакин Даниил</h3>
                    <p className="text-blue-500 font-mono tracking-widest uppercase text-xs sm:text-sm font-semibold">Co-Founder & CEO</p>
                  </div>
                </div>
                <div className="relative z-10 text-center sm:text-left">
                  <h4 className="text-on-surface font-semibold text-lg mb-4 flex items-center justify-center sm:justify-start gap-2">
                    <Sparkles className="w-5 h-5 text-blue-500" /> Выполненная работа:
                  </h4>
                  <ul className="space-y-4 text-on-surface-variant font-light text-[15px] sm:text-[17px] text-left">
                    <li className="flex items-start gap-3"><div className="mt-2 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" /> Проектирование архитектуры платформы и концепции продукта.</li>
                    <li className="flex items-start gap-3"><div className="mt-2 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" /> Интеграция высокоскоростной ИИ логики (Groq API) для генерации курсов.</li>
                    <li className="flex items-start gap-3"><div className="mt-2 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" /> Разработка UI/UX дизайна, глассморфизм-интерфейса и анимаций (Framer Motion).</li>
                  </ul>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.03 }}
                className="group bg-surface-container border border-outline-variant rounded-[1.5rem] md:rounded-[2rem] p-6 sm:p-10 text-left relative overflow-hidden backdrop-blur-xl transition-all duration-500 hover:shadow-[0_0_40px_rgba(168,85,247,0.2)] hover:border-purple-500/40"
              >
                <div className="absolute top-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] -ml-32 -mt-32 transition-opacity group-hover:opacity-100 opacity-50" />
                <div className="flex flex-col sm:flex-row-reverse items-center sm:items-start gap-4 sm:gap-6 mb-6 sm:mb-8 relative z-10 text-center sm:text-right">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-bl from-purple-400 to-fuchsia-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg group-hover:shadow-purple-500/50 transition-shadow flex-shrink-0">
                    AD
                  </div>
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-on-surface mb-1">Дутпаев Адильжан</h3>
                    <p className="text-purple-500 font-mono tracking-widest uppercase text-xs sm:text-sm font-semibold">Co-Founder & CTO</p>
                  </div>
                </div>
                <div className="relative z-10 sm:text-right text-center">
                  <h4 className="text-on-surface font-semibold text-lg mb-4 flex items-center justify-center sm:justify-end gap-2">
                    <span className="block sm:hidden"><Terminal className="w-5 h-5 text-purple-500 inline mr-2"/></span>
                    Выполненная работа: 
                    <Terminal className="w-5 h-5 text-purple-500 hidden sm:block" />
                  </h4>
                  <ul className="space-y-4 text-on-surface-variant font-light text-[15px] sm:text-[17px] text-left sm:text-right">
                    <li className="flex items-start sm:items-start sm:justify-end gap-3 flex-row sm:flex-row"><div className="mt-2 w-2 h-2 rounded-full bg-purple-500 flex-shrink-0 sm:hidden" /><span className="sm:text-right flex-1">Масштабирование инфраструктуры и интеграция Firebase (Auth, Firestore).</span> <div className="mt-2 w-2 h-2 rounded-full bg-purple-500 flex-shrink-0 hidden sm:block" /></li>
                    <li className="flex items-start sm:items-start sm:justify-end gap-3 flex-row sm:flex-row"><div className="mt-2 w-2 h-2 rounded-full bg-purple-500 flex-shrink-0 sm:hidden" /><span className="sm:text-right flex-1">Разработка сложного интерактивного графа знаний на базе Vis-Network.</span> <div className="mt-2 w-2 h-2 rounded-full bg-purple-500 flex-shrink-0 hidden sm:block" /></li>
                    <li className="flex items-start sm:items-start sm:justify-end gap-3 flex-row sm:flex-row"><div className="mt-2 w-2 h-2 rounded-full bg-purple-500 flex-shrink-0 sm:hidden" /><span className="sm:text-right flex-1">Настройка роутинга, локализации (i18n) и логики работы клиентской части.</span> <div className="mt-2 w-2 h-2 rounded-full bg-purple-500 flex-shrink-0 hidden sm:block" /></li>
                  </ul>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-12 px-6 bg-surface-container-highest backdrop-blur-md relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 font-semibold text-lg tracking-tight text-on-surface">
            <Sparkles className="w-5 h-5 text-on-surface" />
            yourway.co
          </div>
          <div className="text-sm text-on-surface-variant font-medium text-right">
            <div>&copy; 2026 yourway.co. All rights reserved.</div>
            <div className="mt-2 text-[10px] uppercase tracking-widest font-mono opacity-70">
              Designed & Developed by Ivakin Daniil & Dutpayev Adilzhan
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
