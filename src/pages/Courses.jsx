import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Brain, Cpu, Network, Languages, Eye, Gamepad2, Sparkles, Scale, Cloud, Star, StarHalf, Clock, BookOpen, CheckCircle } from 'lucide-react';

const coursesData = [
  { id: 1, title: 'Introduction to AI', instructor: 'Dr. Sarah Chen', rating: 4.9, students: '2,340', level: 'Beginner', hours: '8h', lessons: 24, icon: Brain, progress: 100, category: 'AI Fundamentals', gradient: 'from-blue-500 to-cyan-400' },
  { id: 2, title: 'Machine Learning Fundamentals', instructor: 'Prof. James Liu', rating: 4.8, students: '1,890', level: 'Beginner', hours: '12h', lessons: 36, icon: Cpu, progress: 78, category: 'Machine Learning', gradient: 'from-emerald-500 to-teal-400' },
  { id: 3, title: 'Neural Networks Deep Dive', instructor: 'Dr. Emily Watson', rating: 4.7, students: '1,200', level: 'Intermediate', hours: '15h', lessons: 42, icon: Network, progress: 65, category: 'Deep Learning', gradient: 'from-violet-500 to-purple-400' },
  { id: 4, title: 'NLP with Transformers', instructor: 'Dr. Alex Kumar', rating: 4.9, students: '980', level: 'Intermediate', hours: '10h', lessons: 28, icon: Languages, progress: 40, category: 'NLP', gradient: 'from-orange-500 to-amber-400' },
  { id: 5, title: 'Computer Vision Fundamentals', instructor: 'Prof. Lisa Park', rating: 4.6, students: '1,500', level: 'Intermediate', hours: '14h', lessons: 38, icon: Eye, progress: 85, category: 'Computer Vision', gradient: 'from-pink-500 to-rose-400' },
  { id: 6, title: 'Reinforcement Learning', instructor: 'Dr. Michael Torres', rating: 4.8, students: '750', level: 'Advanced', hours: '18h', lessons: 48, icon: Gamepad2, progress: null, category: 'Machine Learning', gradient: 'from-indigo-500 to-blue-400' },
  { id: 7, title: 'GANs & Generative AI', instructor: 'Dr. Nina Patel', rating: 4.9, students: '2,100', level: 'Advanced', hours: '16h', lessons: 44, icon: Sparkles, progress: null, category: 'Deep Learning', gradient: 'from-fuchsia-500 to-pink-400' },
  { id: 8, title: 'AI Ethics & Governance', instructor: 'Prof. David Kim', rating: 4.5, students: '3,200', level: 'Beginner', hours: '6h', lessons: 18, icon: Scale, progress: null, category: 'AI Fundamentals', gradient: 'from-teal-500 to-green-400' },
  { id: 9, title: 'MLOps & Deployment', instructor: 'Dr. Rachel Green', rating: 4.7, students: '890', level: 'Advanced', hours: '20h', lessons: 52, icon: Cloud, progress: null, category: 'Machine Learning', gradient: 'from-sky-500 to-indigo-400' },
];

const categories = ['All', 'AI Fundamentals', 'Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision'];

function getLevelColor(level) {
  switch (level) {
    case 'Beginner': return 'bg-green-500/90 text-white';
    case 'Intermediate': return 'bg-blue-500/90 text-white';
    case 'Advanced': return 'bg-purple-500/90 text-white';
    default: return 'bg-gray-500/90 text-white';
  }
}

function getInitials(name) {
  return name.replace(/^(Dr\.|Prof\.)\s*/, '').trim().split(' ').map(n => n[0]).join('');
}

function getAvatarGradient(index) {
  const gradients = [
    'from-blue-400 to-indigo-500', 'from-emerald-400 to-teal-500', 'from-violet-400 to-purple-500',
    'from-orange-400 to-red-500', 'from-pink-400 to-rose-500', 'from-cyan-400 to-blue-500',
    'from-fuchsia-400 to-pink-500', 'from-teal-400 to-emerald-500', 'from-sky-400 to-indigo-500',
  ];
  return gradients[index % gradients.length];
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 200, damping: 20 } },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
};

function CourseCard({ course, index }) {
  const [enrolled, setEnrolled] = useState(course.progress !== null);
  const Icon = course.icon;

  const renderStars = (rating) => {
    const full = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    const stars = [];
    for (let i = 0; i < full; i++) stars.push(<Star key={`f${i}`} className="w-4 h-4 fill-orange-400 text-orange-400" />);
    if (hasHalf) stars.push(<StarHalf key="h" className="w-4 h-4 fill-orange-400 text-orange-400" />);
    const remaining = 5 - full - (hasHalf ? 1 : 0);
    for (let i = 0; i < remaining; i++) stars.push(<Star key={`e${i}`} className="w-4 h-4 text-gray-400" />);
    return stars;
  };

  return (
    <motion.div
      layout
      variants={cardVariants}
      initial="hidden"
      animate="show"
      exit="exit"
      whileHover={{ y: -5, scale: 1.02 }}
      className="bg-surface rounded-2xl border border-outline-variant overflow-hidden shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 group"
    >
      <div className={`relative h-40 bg-gradient-to-br ${course.gradient} flex items-center justify-center overflow-hidden`}>
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/10" />
        <motion.div 
          whileHover={{ scale: 1.1, rotate: 5 }}
          className="relative z-10 text-white/30 group-hover:text-white/50 transition-colors duration-300"
        >
          <Icon size={72} strokeWidth={1.5} />
        </motion.div>
        <span className={`absolute top-3 right-3 ${getLevelColor(course.level)} text-xs font-semibold px-2.5 py-1 rounded-full shadow-md backdrop-blur-sm`}>
          {course.level}
        </span>
      </div>

      <div className="px-5 py-4">
        <h3 className="text-lg font-bold text-on-surface leading-snug mb-3 group-hover:text-primary transition-colors duration-200">
          {course.title}
        </h3>

        <div className="flex items-center gap-3 mb-4">
          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarGradient(index)} flex items-center justify-center shrink-0 shadow-sm`}>
            <span className="text-xs font-bold text-white">{getInitials(course.instructor)}</span>
          </div>
          <span className="text-sm font-medium text-on-surface-variant">{course.instructor}</span>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-0.5">{renderStars(course.rating)}</div>
          <span className="text-sm font-bold text-on-surface">{course.rating}</span>
          <span className="text-xs text-on-surface-variant">({course.students})</span>
        </div>

        {course.progress !== null ? (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-medium ${course.progress === 100 ? 'text-green-500' : 'text-on-surface-variant'}`}>
                {course.progress === 100 ? 'Completed' : 'In Progress'}
              </span>
              <span className="text-xs font-bold text-on-surface">{course.progress}%</span>
            </div>
            <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${course.progress}%` }}
                transition={{ duration: 1, delay: 0.2 }}
                className={`h-full rounded-full ${course.progress === 100 ? 'bg-green-500' : 'bg-primary'}`}
              />
            </div>
          </div>
        ) : (
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setEnrolled(true)}
            className={`mt-4 w-full py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors ${
              enrolled ? 'bg-green-500/10 text-green-500 cursor-default' : 'bg-primary text-on-primary hover:bg-primary/90 shadow-lg shadow-primary/20'
            }`}
          >
            {enrolled ? (
              <><CheckCircle className="w-5 h-5" /> Enrolled</>
            ) : (
              'Enroll Now'
            )}
          </motion.button>
        )}
      </div>

      <div className="flex items-center justify-between px-5 py-3 border-t border-outline-variant/50 bg-surface-container-low/40">
        <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium">
          <Clock className="w-4 h-4" /> {course.hours}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium">
          <BookOpen className="w-4 h-4" /> {course.lessons} lessons
        </div>
      </div>
    </motion.div>
  );
}

export default function Courses() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCourses = coursesData.filter(course => {
    const matchesCategory = activeCategory === 'All' || course.category === activeCategory;
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          course.instructor.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <motion.main 
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="p-4 md:p-8 max-w-7xl mx-auto"
    >
      <motion.div variants={cardVariants} className="mb-8">
        <h1 className="text-4xl font-bold text-on-surface mb-3 tracking-tight">Course Catalog</h1>
        <p className="text-lg text-on-surface-variant max-w-2xl">Expand your knowledge with our premium curriculum. Track your progress and master new AI capabilities.</p>
      </motion.div>

      <motion.div variants={cardVariants} className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/60" />
          <input 
            type="text" 
            placeholder="Search courses or instructors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 pl-10 pr-4 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all duration-200"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`relative px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat ? 'text-on-primary' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
              }`}
            >
              {activeCategory === cat && (
                <motion.div 
                  layoutId="course-category-pill"
                  className="absolute inset-0 bg-primary rounded-xl z-0 shadow-lg shadow-primary/20"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative z-10">{cat}</span>
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
        <AnimatePresence mode="popLayout">
          {filteredCourses.map((course, index) => (
            <CourseCard key={course.id} course={course} index={index} />
          ))}
        </AnimatePresence>
        
        {filteredCourses.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="col-span-full py-20 flex flex-col items-center justify-center text-on-surface-variant"
          >
            <Search className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-lg">No courses found matching your criteria.</p>
          </motion.div>
        )}
      </motion.div>
    </motion.main>
  );
}
