import React, { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { BookOpen, Clock, Award, Flame, ArrowRight, PlayCircle, CheckCircle, Trophy, Users, HelpCircle, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

function AnimatedNumber({ value }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseInt(value, 10);
    if (start === end) return;

    const totalDuration = 1000;
    let incrementTime = (totalDuration / end) * 2;

    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start === end) clearInterval(timer);
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{count}</span>;
}

export default function Dashboard() {
  const navigate = useNavigate();

  const statCards = [
    { icon: BookOpen, label: 'Active Courses', value: 12, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { icon: Clock, label: 'Hours Learned', value: 148, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { icon: Award, label: 'Certificates', value: 5, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { icon: Flame, label: 'Day Streak', value: 23, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ];

  const courses = [
    { title: 'Neural Networks Deep Dive', instructor: 'Dr. Sarah Chen', progress: 65, gradient: 'from-violet-500 to-indigo-600' },
    { title: 'NLP with Transformers', instructor: 'Prof. James Liu', progress: 40, gradient: 'from-emerald-500 to-teal-600' },
    { title: 'Computer Vision Fundamentals', instructor: 'Dr. Maria Lopez', progress: 85, gradient: 'from-orange-400 to-rose-500' },
  ];

  const activities = [
    { icon: CheckCircle, title: 'Completed lesson: Backpropagation', time: '2 hours ago', color: 'text-green-500', bg: 'bg-green-500/10' },
    { icon: Trophy, title: 'Earned badge: First Certificate', time: '5 hours ago', color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { icon: PlayCircle, title: 'Started course: NLP with Transformers', time: 'Yesterday', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { icon: HelpCircle, title: 'Scored 95% on quiz', time: 'Yesterday', color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { icon: Users, title: 'Joined study group: ML Enthusiasts', time: '2 days ago', color: 'text-teal-500', bg: 'bg-teal-500/10' },
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
            Welcome back, Premium Learner <motion.span animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }} transition={{ repeat: Infinity, duration: 2.5, repeatDelay: 1 }} className="inline-block origin-bottom-right">👋</motion.span>
          </motion.h1>
          <p className="text-lg text-white/70 mb-8 font-light">
            Ready to dive back into your learning? You're on a 23-day streak.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/courses')}
            className="bg-white text-black px-6 py-3 rounded-full font-semibold flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
          >
            <PlayCircle className="w-5 h-5" /> Continue Learning
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

      {/* Courses Row */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-on-surface">Continue Learning</h2>
          <button className="text-sm font-semibold text-primary hover:text-primary/80 flex items-center gap-1 group">
            View All <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
        
        <div className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide">
          {courses.map((course, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ y: -5, scale: 1.02 }}
              className="min-w-[300px] flex-shrink-0 bg-surface border border-outline-variant rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-white/20 transition-all duration-300 cursor-pointer snap-start"
            >
              <div className={`h-24 bg-gradient-to-r ${course.gradient} relative overflow-hidden`}>
                 <div className="absolute inset-0 bg-white/10 mix-blend-overlay"></div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-on-surface mb-1 line-clamp-1">{course.title}</h3>
                <p className="text-sm text-on-surface-variant mb-6">{course.instructor}</p>
                
                <div className="flex justify-between text-sm font-medium mb-2">
                  <span className="text-on-surface-variant">Progress</span>
                  <span className="text-on-surface">{course.progress}%</span>
                </div>
                <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${course.progress}%` }}
                    transition={{ duration: 1, delay: 0.5 + (idx * 0.1) }}
                    className="h-full bg-primary rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Activity & Goal */}
      <motion.div variants={staggerContainer} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Activity */}
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-surface border border-outline-variant rounded-2xl p-6 md:p-8 shadow-sm">
          <h2 className="text-xl font-bold text-on-surface mb-6">Recent Activity</h2>
          <div className="space-y-4">
            {activities.map((activity, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ x: 5, backgroundColor: 'rgba(255,255,255,0.03)' }}
                className="flex items-center gap-4 p-3 rounded-xl transition-colors cursor-default"
              >
                <div className={`p-2 rounded-full ${activity.bg} ${activity.color}`}>
                  <activity.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-on-surface">{activity.title}</h4>
                </div>
                <span className="text-xs text-on-surface-variant">{activity.time}</span>
              </motion.div>
            ))}
          </div>
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
                animate={{ pathLength: 5/7 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-on-surface">5<span className="text-xl text-on-surface-variant">/7</span></span>
              <span className="text-xs font-medium text-on-surface-variant mt-1 uppercase tracking-wider">Days</span>
            </div>
          </div>

          <p className="text-sm font-medium text-on-surface-variant mb-6">Keep going! 2 more days to hit your goal. 🔥</p>

          <div className="flex gap-2 w-full justify-center">
            {['M','T','W','T','F','S','S'].map((day, idx) => (
              <div 
                key={idx} 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  idx < 5 ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                {day}
              </div>
            ))}
          </div>
        </motion.div>

      </motion.div>

    </motion.div>
  );
}
