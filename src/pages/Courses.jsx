import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Brain, 
  Clock, 
  BookOpen, 
  Loader2,
  Sparkles,
  Network,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { getUserCourses, deleteCourse } from '../services/courseService.js';
import { t } from '../i18n.js';
import CourseGeneratorModal from '../components/CourseGeneratorModal.jsx';

function getLevelColor(level) {
  switch (level) {
    case 'Beginner': return 'bg-green-500/90 text-white';
    case 'Intermediate': return 'bg-blue-500/90 text-white';
    case 'Advanced': return 'bg-purple-500/90 text-white';
    default: return 'bg-gray-500/90 text-white';
  }
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

function DeleteConfirmModal({ isOpen, onClose, onConfirm, isDeleting }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={!isDeleting ? onClose : undefined}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.95, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 20, opacity: 0 }}
            className="w-full max-w-sm bg-surface border border-outline-variant rounded-3xl p-6 shadow-2xl relative z-10 overflow-hidden text-center"
          >
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-2">{t('courses.confirmDeleteTitle') || 'Delete Roadmap?'}</h3>
            <p className="text-sm text-on-surface-variant mb-6">{t('courses.confirmDeleteSubtitle') || 'Are you sure you want to delete this roadmap? This action cannot be undone.'}</p>
            <div className="flex gap-3">
              <button disabled={isDeleting} onClick={onClose} className="flex-1 py-3 bg-surface-container rounded-xl text-sm font-bold text-on-surface hover:bg-surface-container-high transition-colors">
                {t('courses.cancel') || 'Cancel'}
              </button>
              <button disabled={isDeleting} onClick={onConfirm} className="flex-1 py-3 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-colors flex justify-center items-center">
                {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : (t('courses.delete') || 'Delete')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function CourseCard({ course, onDelete }) {
  const navigate = useNavigate();
  const Icon = Brain;

  const handleOpenClick = () => {
    localStorage.setItem('selected_course_id', course.id);
    navigate('/graph');
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(course.id);
  };

  return (
    <motion.div
      layout
      variants={cardVariants}
      initial="hidden"
      animate="show"
      exit="exit"
      whileHover={{ y: -5, scale: 1.02 }}
      onClick={handleOpenClick}
      className="bg-surface rounded-2xl border border-outline-variant overflow-hidden shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 group cursor-pointer flex flex-col h-full"
    >
      <div className={`relative h-40 bg-gradient-to-br ${course.gradient || 'from-indigo-500 to-purple-500'} flex items-center justify-center overflow-hidden shrink-0`}>
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/10" />
        <motion.div 
          whileHover={{ scale: 1.1, rotate: 5 }}
          className="relative z-10 text-white/30 group-hover:text-white/50 transition-colors duration-300"
        >
          <Icon size={72} strokeWidth={1.5} />
        </motion.div>
        <span className={`absolute top-3 right-3 ${getLevelColor(course.level || 'Beginner')} text-xs font-semibold px-2.5 py-1 rounded-full shadow-md backdrop-blur-sm`}>
          {t('level.' + (course.level || 'Beginner'))}
        </span>
        <button 
          onClick={handleDelete}
          className="absolute top-3 left-3 bg-red-500/80 hover:bg-red-600 text-white p-1.5 rounded-full shadow-md backdrop-blur-sm transition-colors opacity-0 group-hover:opacity-100"
          title="Delete roadmap"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="px-5 py-4 flex-1 flex flex-col">
        <h3 className="text-lg font-bold text-on-surface leading-snug mb-2 group-hover:text-primary transition-colors duration-200 line-clamp-2">
          {t(course.title)}
        </h3>
        <p className="text-sm text-on-surface-variant mb-4 line-clamp-2">{course.description || ''}</p>

        <div className="mt-auto">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-medium ${course.progress === 100 ? 'text-green-500' : 'text-on-surface-variant'}`}>
              {course.progress === 100 ? t('courses.completed') : t('courses.inProgress')}
            </span>
            <span className="text-xs font-bold text-on-surface">{course.progress || 0}%</span>
          </div>
          <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden mb-2">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${course.progress || 0}%` }}
              transition={{ duration: 1, delay: 0.2 }}
              className={`h-full rounded-full ${course.progress === 100 ? 'bg-green-500' : 'bg-primary'}`}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-5 py-3 border-t border-outline-variant/50 bg-surface-container-low/40 shrink-0">
        <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium">
          <Clock className="w-4 h-4" /> {course.hours || '0h'}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium">
          <BookOpen className="w-4 h-4" /> {course.nodes?.length || 0} {t('courses.lessons')}
        </div>
      </div>
    </motion.div>
  );
}

export default function Courses() {
  const [user, setUser] = useState(auth.currentUser);
  const [userCourses, setUserCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showGenModal, setShowGenModal] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const fetched = await getUserCourses(currentUser.uid);
          setUserCourses(fetched);
        } catch (e) {
          console.error("Error loading user courses:", e);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const refreshCourses = async () => {
    if (!user) return;
    try {
      const fetched = await getUserCourses(user.uid);
      setUserCourses(fetched);
    } catch (e) {
      console.error("Error refreshing courses:", e);
    }
  };

  const confirmDelete = async () => {
    if (!user || !courseToDelete) return;
    setIsDeleting(true);
    try {
      await deleteCourse(courseToDelete, user.uid);
      setUserCourses(prev => prev.filter(c => c.id !== courseToDelete));
      setCourseToDelete(null);
    } catch (e) {
      console.error("Failed to delete course:", e);
      // Fallback alert if something really breaks
      alert("Failed to delete course.");
    } finally {
      setIsDeleting(false);
    }
  };

  const requestDelete = (courseId) => {
    setCourseToDelete(courseId);
  };

  const filteredCourses = userCourses.filter(course => {
    return course.title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-on-surface gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-medium tracking-wide">{t('courses.loadingCatalog')}</p>
      </div>
    );
  }

  return (
    <motion.main 
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="p-4 md:p-8 max-w-7xl mx-auto"
    >
      <motion.div variants={cardVariants} className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-on-surface mb-3 tracking-tight">{t('dashboard.yourRoadmaps') || t('courses.title')}</h1>
          <p className="text-lg text-on-surface-variant max-w-2xl">{t('courses.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowGenModal(true)}
          className="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/95 transition-colors whitespace-nowrap flex items-center gap-2"
        >
          <Sparkles className="w-5 h-5 fill-white" />
          {t('dashboard.generateCourse')}
        </button>
      </motion.div>

      {userCourses.length > 0 && (
        <motion.div variants={cardVariants} className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/60" />
            <input 
              type="text" 
              placeholder={t('courses.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 pl-10 pr-4 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all duration-200"
            />
          </div>
        </motion.div>
      )}

      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
        <AnimatePresence mode="popLayout">
          {filteredCourses.map((course) => (
            <CourseCard 
              key={course.id} 
              course={course} 
              onDelete={requestDelete}
            />
          ))}
        </AnimatePresence>
        
        {userCourses.length > 0 && filteredCourses.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="col-span-full py-20 flex flex-col items-center justify-center text-on-surface-variant"
          >
            <Search className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-lg">{t('courses.noMatching')}</p>
          </motion.div>
        )}
      </motion.div>

      {userCourses.length === 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="col-span-full py-24 flex flex-col items-center justify-center text-center bg-surface border border-dashed border-outline-variant rounded-3xl"
        >
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6 border border-primary/20">
            <Network className="w-12 h-12 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-on-surface mb-3">{t('dashboard.noCourses')}</h2>
          <p className="text-on-surface-variant mb-8 max-w-md">
            {t('dashboard.generateCustomDesc')}
          </p>
          <button
            onClick={() => setShowGenModal(true)}
            className="bg-primary text-on-primary px-8 py-4 rounded-xl font-bold shadow-xl shadow-primary/20 hover:bg-primary/95 transition-all flex items-center gap-2 text-lg"
          >
            <Sparkles className="w-6 h-6 fill-white" />
            {t('dashboard.generateFirst')}
          </button>
        </motion.div>
      )}

      <CourseGeneratorModal 
        isOpen={showGenModal} 
        onClose={() => setShowGenModal(false)} 
        userUid={user?.uid} 
        onCourseGenerated={refreshCourses}
      />

      <DeleteConfirmModal 
        isOpen={!!courseToDelete}
        onClose={() => setCourseToDelete(null)}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
      />
    </motion.main>
  );
}
