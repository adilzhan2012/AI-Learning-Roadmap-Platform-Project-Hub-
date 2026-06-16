import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Clock, 
  Award, 
  Flame, 
  ArrowRight, 
  PlayCircle, 
  CheckCircle, 
  Trophy, 
  Users, 
  HelpCircle, 
  Activity, 
  Brain, 
  Sparkles, 
  Loader2,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  getUserStats, 
  getUserCourses, 
  getRecentActivities, 
  generateCourseAndSave,
  getGeminiApiKey
} from '../services/courseService.js';

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const iconMap = {
  school: BookOpen,
  check_circle: CheckCircle,
  emoji_events: Trophy,
  manage_accounts: Users,
  quiz: HelpCircle,
  trophy: Trophy,
  play: PlayCircle,
  activity: Activity
};

function AnimatedNumber({ value }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = Math.round(parseFloat(value) || 0);
    if (end <= 0) {
      setCount(0);
      return;
    }
    if (start === end) return;

    const totalDuration = 1000;
    let incrementTime = (totalDuration / end) * 2;
    if (incrementTime < 10) incrementTime = 10;

    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{count}</span>;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(auth.currentUser);
  const [stats, setStats] = useState({
    activeCoursesCount: 0,
    hoursLearned: 0,
    certificatesCount: 0,
    streakDays: 1,
    firstName: 'Premium',
    lastName: 'Learner'
  });
  const [courses, setCourses] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // AI Generator modal state
  const [showGenModal, setShowGenModal] = useState(false);
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('Beginner');
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');

  const hasApiKey = !!getGeminiApiKey();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const fetchedStats = await getUserStats(currentUser.uid);
          setStats(fetchedStats);

          const fetchedCourses = await getUserCourses(currentUser.uid);
          setCourses(fetchedCourses);

          const fetchedActivities = await getRecentActivities(currentUser.uid);
          setActivities(fetchedActivities);
        } catch (e) {
          console.error("Error loading dashboard data:", e);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setGenError('');
    setGenerating(true);

    try {
      const generated = await generateCourseAndSave(user.uid, topic, level);
      setShowGenModal(false);
      setTopic('');
      // Redirect to the newly generated course's Knowledge Graph
      // Store selected course ID in localStorage to open it automatically in Graph
      localStorage.setItem('selected_course_id', generated.id);
      navigate('/graph');
    } catch (err) {
      console.error(err);
      if (err.message === 'MISSING_API_KEY') {
        setGenError('Gemini API Key is missing. Please set it in Settings.');
      } else {
        setGenError(err.message || 'Failed to generate course. Please try again.');
      }
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#000000] text-white gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-medium tracking-wide">Loading Dashboard...</p>
      </div>
    );
  }

  const statCards = [
    { icon: BookOpen, label: 'Active Courses', value: stats.activeCoursesCount || 0, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { icon: Clock, label: 'Hours Learned', value: stats.hoursLearned || 0, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { icon: Award, label: 'Certificates', value: stats.certificatesCount || 0, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { icon: Flame, label: 'Day Streak', value: stats.streakDays || 1, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ];

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={staggerContainer}
      className="p-4 md:p-8 max-w-7xl mx-auto space-y-8"
    >
      {/* Hero Banner */}
      <motion.div 
        variants={itemVariants}
        className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-900 via-purple-900 to-black p-8 md:p-12 shadow-2xl border border-white/10"
      >
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-500/20 blur-[100px] rounded-full pointer-events-none"></div>
        
        <div className="relative z-10 max-w-2xl">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight"
          >
            Welcome back, {stats.firstName || 'Learner'} <motion.span animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }} transition={{ repeat: Infinity, duration: 2.5, repeatDelay: 1 }} className="inline-block origin-bottom-right">👋</motion.span>
          </motion.h1>
          <p className="text-lg text-white/70 mb-8 font-light">
            Ready to dive back into your learning? You're on a {stats.streakDays || 1}-day streak.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowGenModal(true)}
            className="bg-white text-black px-6 py-3 rounded-full font-semibold flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:bg-neutral-100 transition-colors"
          >
            <Sparkles className="w-5 h-5 text-indigo-600 fill-indigo-600" /> Generate New Course
          </motion.button>
        </div>
      </motion.div>

      {/* Stats Row */}
      <motion.div variants={staggerContainer} className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {statCards.map((stat, idx) => (
          <motion.div 
            key={idx}
            variants={itemVariants}
            whileHover={{ y: -5, scale: 1.02 }}
            className="bg-surface border border-outline-variant rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <Activity className="w-5 h-5 text-on-surface-variant/30" />
            </div>
            <h3 className="text-3xl font-bold text-on-surface mb-1">
              <AnimatedNumber value={stat.value} />
            </h3>
            <p className="text-sm font-medium text-on-surface-variant">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* AI Course Builder Entrypoint Card */}
      <motion.div 
        variants={itemVariants} 
        className="bg-surface border border-outline-variant rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row gap-6 items-center relative overflow-hidden group cursor-pointer"
        onClick={() => setShowGenModal(true)}
      >
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/5 blur-[80px] rounded-full pointer-events-none group-hover:bg-primary/10 transition-colors duration-500"></div>
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
          <Brain className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-on-surface">Generate a Custom Course</h2>
          <p className="text-sm text-on-surface-variant mt-1">Write down any subject you want to learn (e.g. Neural Networks, Ancient Rome) and let AI customize your personal curriculum with a prerequisites graph.</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/95 transition-colors whitespace-nowrap flex items-center gap-1.5"
        >
          Build Roadmap <Sparkles className="w-4 h-4 text-white fill-white" />
        </motion.button>
      </motion.div>

      {/* Courses Row */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-on-surface">Your Roadmap Courses</h2>
          <button onClick={() => navigate('/courses')} className="text-sm font-semibold text-primary hover:text-primary/80 flex items-center gap-1 group">
            View All Catalog <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
        
        {courses.length === 0 ? (
          <div className="bg-surface border border-dashed border-outline-variant rounded-2xl p-10 text-center flex flex-col items-center justify-center">
            <BookOpen className="w-12 h-12 text-on-surface-variant/40 mb-4" />
            <p className="text-on-surface-variant font-medium mb-4">You have not generated or enrolled in any courses yet.</p>
            <button 
              onClick={() => setShowGenModal(true)}
              className="bg-primary text-on-primary px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-primary/90 transition-all"
            >
              Generate Your First Course
            </button>
          </div>
        ) : (
          <div className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide">
            {courses.map((course, idx) => (
              <motion.div 
                key={course.id}
                whileHover={{ y: -5, scale: 1.02 }}
                onClick={() => {
                  localStorage.setItem('selected_course_id', course.id);
                  navigate('/graph');
                }}
                className="min-w-[300px] flex-shrink-0 bg-surface border border-outline-variant rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 cursor-pointer snap-start"
              >
                <div className={`h-24 bg-gradient-to-r ${course.gradient || 'from-indigo-500 to-purple-600'} relative overflow-hidden`}>
                   <div className="absolute inset-0 bg-white/10 mix-blend-overlay"></div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-on-surface mb-1 line-clamp-1">{course.title}</h3>
                  <p className="text-sm text-on-surface-variant mb-6">{course.category} • {course.level}</p>
                  
                  <div className="flex justify-between text-sm font-medium mb-2">
                    <span className="text-on-surface-variant">Progress</span>
                    <span className="text-on-surface">{course.progress || 0}%</span>
                  </div>
                  <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${course.progress || 0}%` }}
                      transition={{ duration: 1, delay: 0.5 + (idx * 0.1) }}
                      className="h-full bg-primary rounded-full"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Activity & Goal */}
      <motion.div variants={staggerContainer} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Activity */}
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-surface border border-outline-variant rounded-2xl p-6 md:p-8 shadow-sm">
          <h2 className="text-xl font-bold text-on-surface mb-6">Recent Activity</h2>
          {activities.length === 0 ? (
            <p className="text-on-surface-variant text-sm py-4">No recent activity. Start studying to log your progress!</p>
          ) : (
            <div className="space-y-4">
              {activities.map((activity, idx) => {
                const IconComponent = iconMap[activity.icon] || Activity;
                return (
                  <motion.div 
                    key={activity.id || idx}
                    whileHover={{ x: 5, backgroundColor: 'rgba(255,255,255,0.03)' }}
                    className="flex items-center gap-4 p-3 rounded-xl transition-colors cursor-default"
                  >
                    <div className={`p-2 rounded-full bg-primary/10 ${activity.color || 'text-primary'}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-on-surface">{activity.title}</h4>
                    </div>
                    <span className="text-xs text-on-surface-variant">
                      {new Date(activity.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Weekly Goal */}
        <motion.div variants={itemVariants} className="bg-surface border border-outline-variant rounded-2xl p-6 md:p-8 shadow-sm flex flex-col items-center justify-center text-center">
          <h2 className="text-xl font-bold text-on-surface w-full text-left mb-8">Weekly Goal</h2>
          
          <div className="relative w-40 h-40 mb-6">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 drop-shadow-lg">
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" className="text-surface-container stroke-[8px]" />
              <motion.circle 
                cx="50" cy="50" r="45" 
                fill="none" 
                stroke="currentColor" 
                className="text-primary stroke-[8px]"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: Math.min((stats.activeCoursesCount || 1) / 3, 1) }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-on-surface">{stats.activeCoursesCount || 0}<span className="text-xl text-on-surface-variant">/3</span></span>
              <span className="text-xs font-medium text-on-surface-variant mt-1 uppercase tracking-wider">Courses Active</span>
            </div>
          </div>

          <p className="text-sm font-medium text-on-surface-variant mb-6">
            {stats.activeCoursesCount >= 3 ? "Weekly goals achieved! Great work! 🎉" : "Aim to generate and study 3 active roadmaps. 🔥"}
          </p>

          <div className="flex gap-2 w-full justify-center">
            {['M','T','W','T','F','S','S'].map((day, idx) => {
              const active = idx < (stats.streakDays || 1);
              return (
                <div 
                  key={idx} 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    active ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-surface-container text-on-surface-variant'
                  }`}
                >
                  {day}
                </div>
              );
            })}
          </div>
        </motion.div>

      </motion.div>

      {/* AI generator modal */}
      <AnimatePresence>
        {showGenModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !generating && setShowGenModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="w-full max-w-lg bg-surface border border-outline-variant rounded-3xl p-6 md:p-8 shadow-2xl relative z-10 overflow-hidden"
            >
              {generating && (
                <div className="absolute inset-0 bg-surface/90 backdrop-blur-md z-20 flex flex-col items-center justify-center p-6 text-center">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                    className="mb-6"
                  >
                    <Brain className="w-16 h-16 text-primary" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-on-surface mb-2">Crafting your custom roadmap...</h3>
                  <p className="text-sm text-on-surface-variant max-w-sm">
                    Gemini is structuring chapters, detailing lessons, and generating the prerequisite connections graph. This will take about 10 seconds.
                  </p>
                  <Loader2 className="w-6 h-6 animate-spin text-primary mt-6" />
                </div>
              )}

              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-on-surface flex items-center gap-2">
                    <Brain className="w-6 h-6 text-primary" /> AI Course Generator
                  </h3>
                  <p className="text-sm text-on-surface-variant mt-1">Design a customized learning path for any technical topic.</p>
                </div>
                <button 
                  disabled={generating} 
                  onClick={() => setShowGenModal(false)}
                  className="p-1.5 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {!hasApiKey && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl p-4 text-xs font-semibold mb-6">
                  ⚠️ No Gemini API Key detected. Please open the Settings tab to configure it before attempting generation.
                </div>
              )}

              <form onSubmit={handleCreateCourse} className="space-y-6">
                {genError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl p-4 text-sm font-semibold">
                    {genError}
                  </div>
                )}

                <div>
                  <label htmlFor="topic" className="block text-sm font-bold text-on-surface mb-2">Subject / Topic you want to learn</label>
                  <input 
                    type="text" 
                    id="topic" 
                    required 
                    disabled={generating}
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Advanced Rust, Deep Learning for NLP, Calculus 1"
                    className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2">Target Difficulty Level</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Beginner', 'Intermediate', 'Advanced'].map(lvl => (
                      <button
                        key={lvl}
                        type="button"
                        disabled={generating}
                        onClick={() => setLevel(lvl)}
                        className={`py-3.5 rounded-xl text-sm font-bold transition-all ${
                          level === lvl 
                            ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' 
                            : 'bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-outline-variant flex justify-end gap-3">
                  <button 
                    type="button" 
                    disabled={generating} 
                    onClick={() => setShowGenModal(false)}
                    className="px-5 py-3 rounded-xl text-sm font-bold text-on-surface hover:bg-surface-container-high transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={generating || !hasApiKey} 
                    className="bg-primary text-on-primary px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/95 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    Generate Roadmap <Sparkles className="w-4 h-4 fill-white" />
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}

