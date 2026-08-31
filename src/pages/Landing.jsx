import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Activity, Moon, CheckCircle2, Zap, Layers, Terminal, Star, Quote } from 'lucide-react';
import Logo from '../components/shared/Logo.jsx';
import UserAvatar from '../components/shared/UserAvatar.jsx';
import { auth, db } from '../firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { t, useLocale, setLocale } from '../i18n.js';
import { toggleTheme } from '../theme.js';

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
  const [isLoggedIn, setIsLoggedIn] = useState(!!auth.currentUser);
  const locale = useLocale();
  const [publishedReviews, setPublishedReviews] = useState([]);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });
    return () => unsubscribe();
  }, []);
  
  const toggleLocale = () => {
    const nextLocale = locale === 'ru' ? 'en' : 'ru';
    setLocale(nextLocale);
  };

  useEffect(() => {
    let isMounted = true;
    const fetchReviews = async () => {
      try {
        const q = query(
          collection(db, 'reviews'),
          where('status', '==', 'published'),
          limit(9)
        );
        const snap = await getDocs(q);
        const list = [];
        snap.forEach(docSnap => list.push({ id: docSnap.id, ...docSnap.data() }));

        // Client-side sorting by publishedAt/createdAt desc to prevent index errors
        list.sort((a, b) => {
          const timeA = a.publishedAt?.toMillis ? a.publishedAt.toMillis() : (a.createdAt?.toMillis ? a.createdAt.toMillis() : 0);
          const timeB = b.publishedAt?.toMillis ? b.publishedAt.toMillis() : (b.createdAt?.toMillis ? b.createdAt.toMillis() : 0);
          return timeB - timeA;
        });

        if (isMounted) {
          setPublishedReviews(list);
        }
      } catch (err) {
        console.warn("Could not load landing reviews:", err);
      }
    };

    fetchReviews();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-on-background font-sans overflow-x-hidden selection:bg-primary-container w-full relative">
      
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
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => toggleTheme()}
              className="p-1.5 md:p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-full transition-colors"
              title={locale === 'ru' ? 'Переключить тему' : 'Toggle Theme'}
            >
              <Moon className="w-5 h-5" />
            </button>
            <button
              onClick={toggleLocale}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-outline-variant hover:border-primary/50 bg-surface-container-high/45 hover:bg-surface-container-high/80 text-xs font-semibold tracking-wide transition-all shadow-sm duration-200 select-none text-on-surface"
              title={locale === 'ru' ? 'Switch to English' : 'Переключить на русский'}
            >
              <span>{locale === 'ru' ? 'RU' : 'EN'}</span>
            </button>

            {isLoggedIn ? (
              <Link to="/dashboard">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-sm font-medium bg-primary text-on-primary px-4 py-2 rounded-full inline-block shadow-lg"
                >
                  {t('landing.nav.dashboard')}
                </motion.button>
              </Link>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/login" className="text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors">{t('landing.nav.login')}</Link>
                <Link to="/register">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="text-sm font-medium bg-primary text-on-primary px-4 py-2 rounded-full inline-block shadow-lg"
                  >
                    {t('landing.nav.signup')}
                  </motion.button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </motion.nav>

      {/* Hero Interactive Dashboard Wrapper */}
      <main className="relative pt-24 pb-12 md:pt-32 md:pb-32 px-4 sm:px-6 flex flex-col items-center justify-center text-center z-10 min-h-screen w-full">
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 items-center gap-8 lg:gap-12 text-left"
        >
          {/* Left Text & Action Area */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            <motion.div variants={fadeUpVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Learning Platform</span>
            </motion.div>

            <motion.h1 variants={fadeUpVariants} className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-4 md:mb-6 leading-tight break-words">
              <span className="text-on-surface">
                yourwayy.co
              </span>
            </motion.h1>
            
            <motion.p variants={fadeUpVariants} className="text-base sm:text-lg md:text-xl text-on-surface-variant max-w-xl mb-8 font-light break-words">
              {t('landing.hero.subtitle')}
            </motion.p>
            
            <motion.div variants={fadeUpVariants} className="flex flex-col sm:flex-row items-center gap-4 mb-4 w-full sm:w-auto">
              {isLoggedIn ? (
                <Link to="/dashboard" className="w-full sm:w-auto">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full sm:w-auto justify-center px-8 py-4 rounded-full bg-primary text-on-primary font-semibold text-lg shadow-xl flex items-center gap-2"
                  >
                    {t('landing.hero.enterWorkspace')} <ArrowRight className="w-5 h-5" />
                  </motion.button>
                </Link>
              ) : (
                <Link to="/register" className="w-full sm:w-auto">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full sm:w-auto justify-center px-8 py-4 rounded-full bg-primary text-on-primary font-semibold text-lg shadow-xl flex items-center gap-2"
                  >
                    {t('landing.hero.startLearning')} <Activity className="w-5 h-5" />
                  </motion.button>
                </Link>
              )}
            </motion.div>
          </div>

          {/* Right Interactive AI Roadmap Generator Bento Card Preview */}
          <div className="w-full flex items-center justify-center lg:justify-end">
            <motion.div 
              variants={fadeUpVariants}
              className="relative w-full max-w-lg min-h-[340px] rounded-[2.5rem] overflow-hidden bg-surface-container/70 backdrop-blur-2xl border border-primary/25 shadow-2xl group cursor-pointer p-6 sm:p-7 flex flex-col justify-between transition-all duration-500 hover:border-primary/50 hover:shadow-[0_0_50px_rgba(var(--color-primary),0.25)]"
              whileHover={{ y: -4, scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
            {/* Ambient Background Glows */}
            <div className="absolute -top-20 -right-20 w-56 h-56 bg-primary/20 rounded-full blur-[70px] pointer-events-none group-hover:bg-primary/35 transition-all duration-700" />
            <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-purple-500/20 rounded-full blur-[70px] pointer-events-none group-hover:bg-purple-500/35 transition-all duration-700" />

            {/* Header bar with Status Badge */}
            <div className="flex items-center justify-between gap-3 mb-4 z-10">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 animate-pulse text-primary" />
                <span>{t('landing.demo.statusBadge')}</span>
              </div>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
              </div>
            </div>

            {/* AI Prompt Input Bar Simulation */}
            <div className="relative mb-5 z-10">
              <div className="w-full bg-surface/90 border border-outline-variant rounded-2xl py-3 px-4 flex items-center justify-between gap-3 shadow-inner">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Zap className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-on-surface font-medium truncate">
                    {t('landing.demo.promptValue')}
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-primary text-on-primary text-[10px] font-bold uppercase tracking-wider flex-shrink-0 shadow-md">
                  AI GEN
                </span>
              </div>
            </div>

            {/* Dynamic Generated Steps */}
            <div className="flex flex-col gap-2.5 z-10 flex-1 justify-center my-2">
              {/* Step 1 */}
              <motion.div 
                initial={{ x: -10, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-high/60 border border-outline-variant/50 text-xs sm:text-sm"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span className="text-on-surface font-medium truncate">{t('landing.demo.step1.title')}</span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-full flex-shrink-0">
                  {t('landing.demo.step1.status')}
                </span>
              </motion.div>

              {/* Step 2 (In Progress) */}
              <motion.div 
                initial={{ x: -10, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-primary/10 border border-primary/40 text-xs sm:text-sm shadow-sm"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                  </span>
                  <span className="text-on-surface font-semibold truncate">{t('landing.demo.step2.title')}</span>
                </div>
                <span className="text-[11px] font-bold text-primary bg-primary/15 px-2.5 py-0.5 rounded-full flex-shrink-0">
                  {t('landing.demo.step2.status')}
                </span>
              </motion.div>

              {/* Step 3 */}
              <motion.div 
                initial={{ x: -10, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-high/30 border border-outline-variant/30 text-xs sm:text-sm opacity-75"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Layers className="w-4 h-4 text-on-surface-variant flex-shrink-0" />
                  <span className="text-on-surface-variant font-medium truncate">{t('landing.demo.step3.title')}</span>
                </div>
                <span className="text-[11px] font-medium text-on-surface-variant bg-on-surface/5 px-2.5 py-0.5 rounded-full flex-shrink-0">
                  {t('landing.demo.step3.status')}
                </span>
              </motion.div>
            </div>

            {/* Footer Metadata */}
            <div className="pt-3 mt-2 border-t border-outline-variant/40 flex items-center justify-between text-[11px] text-on-surface-variant z-10">
              <div className="flex items-center gap-1.5 font-medium">
                <Activity className="w-3.5 h-3.5 text-primary" />
                <span>{t('landing.demo.nodesMeta')}</span>
              </div>
              <span className="font-mono text-[10px] opacity-70">yourwayy.co</span>
            </div>

            {/* Hover Action Overlay */}
            <Link to={isLoggedIn ? "/dashboard" : "/register"} className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-background/60 backdrop-blur-md">
              <motion.span 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 rounded-full bg-primary text-on-primary font-semibold shadow-2xl flex items-center gap-2 text-sm"
              >
                {t('landing.hero.launchEnv')} <ArrowRight className="w-4 h-4" />
              </motion.span>
            </Link>
          </motion.div>
          </div>

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
                  {t('landing.beta.badge')}
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-on-surface mb-2">{t('landing.beta.title')}</h3>
                <p className="text-on-surface-variant text-sm md:text-base leading-relaxed">
                  {t('landing.beta.desc')}
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
              {t('landing.overview.title')}
            </motion.h2>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="relative overflow-hidden bg-surface-container/60 backdrop-blur-xl border border-outline-variant rounded-[2rem] p-8 md:p-12 mx-2 shadow-2xl group transition-all hover:border-primary/30"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5 opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-[80px] pointer-events-none group-hover:bg-primary/30 transition-all duration-700" />
              <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px] pointer-events-none group-hover:bg-purple-500/30 transition-all duration-700" />
              
              <p className="relative z-10 text-on-surface text-lg sm:text-xl md:text-2xl font-medium leading-relaxed">
                {t('landing.overview.desc')}
              </p>
            </motion.div>
          </div>

          {/* Interactive Feature Cards */}
          <div className="grid md:grid-cols-2 gap-6 md:gap-8 w-full px-2">
            {[
              {
                title: t('landing.features.graph.title'),
                desc: t('landing.features.graph.desc'),
                icon: "🕸️",
                color: "from-emerald-500/20 to-teal-500/20",
                borderColor: "group-hover:border-emerald-500/50"
              },
              {
                title: t('landing.features.lessons.title'),
                desc: t('landing.features.lessons.desc'),
                icon: "🧠",
                color: "from-blue-500/20 to-indigo-500/20",
                borderColor: "group-hover:border-blue-500/50"
              },
              {
                title: t('landing.features.lang.title'),
                desc: t('landing.features.lang.desc'),
                icon: "🌍",
                color: "from-purple-500/20 to-fuchsia-500/20",
                borderColor: "group-hover:border-purple-500/50"
              },
              {
                title: t('landing.features.game.title'),
                desc: t('landing.features.game.desc'),
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
          
          {/* Student Reviews Section (Renders only if published reviews exist) */}
          {publishedReviews.length > 0 && (
            <div className="mt-8 md:mt-12 text-center px-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mb-8 md:mb-12"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-semibold mb-3">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{t('landing.reviews.title')}</span>
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-on-surface mb-3">
                  {t('landing.reviews.title')}
                </h2>
                <p className="text-on-surface-variant text-sm md:text-base max-w-2xl mx-auto">
                  {t('landing.reviews.subtitle')}
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 w-full text-left">
                {publishedReviews.map((review, idx) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.08 }}
                    whileHover={{ y: -5, scale: 1.01 }}
                    className="group relative overflow-hidden rounded-[1.5rem] md:rounded-[2rem] bg-surface-container backdrop-blur-xl border border-outline-variant hover:border-primary/40 p-6 md:p-8 flex flex-col justify-between transition-all duration-300 shadow-xl"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all pointer-events-none" />
                    
                    <div>
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            photoURL={review.photoURL}
                            firstName={review.userName}
                            avatarColor={review.userAvatarColor}
                            className="w-10 h-10 text-xs border border-outline-variant shadow-sm"
                          />
                          <div>
                            <h4 className="font-semibold text-sm text-on-surface line-clamp-1">
                              {review.userName || (locale === 'en' ? 'Learner' : 'Ученик')}
                            </h4>
                            <span className="text-[11px] text-on-surface-variant">
                              {review.publishedAt || review.createdAt
                                ? new Date(
                                    (review.publishedAt || review.createdAt).toDate 
                                      ? (review.publishedAt || review.createdAt).toDate() 
                                      : (review.publishedAt || review.createdAt)
                                  ).toLocaleDateString(locale === 'en' ? 'en-US' : 'ru-RU', { month: 'short', day: 'numeric', year: 'numeric' })
                                : ''}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Rating stars */}
                      <div className="flex items-center gap-1 mb-3">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-4 h-4 ${
                              s <= (review.rating || 5)
                                ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.3)]'
                                : 'text-on-surface-variant/20 fill-transparent'
                            }`}
                          />
                        ))}
                      </div>

                      {/* Review Text */}
                      <p className="text-sm md:text-base text-on-surface-variant leading-relaxed line-clamp-4 font-light">
                        "{review.text}"
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
          
          {/* Founders Section */}
          <div className="mt-8 md:mt-12 text-center px-2">
             <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-4xl md:text-5xl font-bold mb-8 md:mb-12 text-on-surface"
            >
              {t('landing.team.title')}
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
                    <h3 className="text-2xl sm:text-3xl font-bold text-on-surface mb-1">{locale === 'ru' ? 'Ивакин Даниил' : 'Ivakin Daniil'}</h3>
                    <p className="text-blue-500 font-mono tracking-widest uppercase text-xs sm:text-sm font-semibold">{locale === 'ru' ? 'Сооснователь & CEO' : 'Co-Founder & CEO'}</p>
                  </div>
                </div>
                <div className="relative z-10 text-center sm:text-left">
                  <h4 className="text-on-surface font-semibold text-lg mb-4 flex items-center justify-center sm:justify-start gap-2">
                    <Sparkles className="w-5 h-5 text-blue-500" /> {t('landing.team.workDone')}
                  </h4>
                  <ul className="space-y-4 text-on-surface-variant font-light text-[15px] sm:text-[17px] text-left">
                    <li className="flex items-start gap-3"><div className="mt-2 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" /> {t('landing.team.di.task1')}</li>
                    <li className="flex items-start gap-3"><div className="mt-2 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" /> {t('landing.team.di.task2')}</li>
                    <li className="flex items-start gap-3"><div className="mt-2 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" /> {t('landing.team.di.task3')}</li>
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
                    <h3 className="text-2xl sm:text-3xl font-bold text-on-surface mb-1">{locale === 'ru' ? 'Дутпаев Адильжан' : 'Dutpayev Adilzhan'}</h3>
                    <p className="text-purple-500 font-mono tracking-widest uppercase text-xs sm:text-sm font-semibold">{locale === 'ru' ? 'Co-Founder & CTO' : 'Co-Founder & CTO'}</p>
                  </div>
                </div>
                <div className="relative z-10 sm:text-right text-center">
                  <h4 className="text-on-surface font-semibold text-lg mb-4 flex items-center justify-center sm:justify-end gap-2">
                    <span className="block sm:hidden"><Terminal className="w-5 h-5 text-purple-500 inline mr-2"/></span>
                    {t('landing.team.workDone')} 
                    <Terminal className="w-5 h-5 text-purple-500 hidden sm:block" />
                  </h4>
                  <ul className="space-y-4 text-on-surface-variant font-light text-[15px] sm:text-[17px] text-left sm:text-right">
                    <li className="flex items-start sm:items-start sm:justify-end gap-3 flex-row sm:flex-row"><div className="mt-2 w-2 h-2 rounded-full bg-purple-500 flex-shrink-0 sm:hidden" /><span className="sm:text-right flex-1">{t('landing.team.ad.task1')}</span> <div className="mt-2 w-2 h-2 rounded-full bg-purple-500 flex-shrink-0 hidden sm:block" /></li>
                    <li className="flex items-start sm:items-start sm:justify-end gap-3 flex-row sm:flex-row"><div className="mt-2 w-2 h-2 rounded-full bg-purple-500 flex-shrink-0 sm:hidden" /><span className="sm:text-right flex-1">{t('landing.team.ad.task2')}</span> <div className="mt-2 w-2 h-2 rounded-full bg-purple-500 flex-shrink-0 hidden sm:block" /></li>
                    <li className="flex items-start sm:items-start sm:justify-end gap-3 flex-row sm:flex-row"><div className="mt-2 w-2 h-2 rounded-full bg-purple-500 flex-shrink-0 sm:hidden" /><span className="sm:text-right flex-1">{t('landing.team.ad.task3')}</span> <div className="mt-2 w-2 h-2 rounded-full bg-purple-500 flex-shrink-0 hidden sm:block" /></li>
                  </ul>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
