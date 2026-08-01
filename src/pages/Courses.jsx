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
  Grid,
  List as ListIcon,
  Award,
  Download,
  ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { getUserCourses, deleteCourse, requestCourseCertificate, getCourseCertificate } from '../services/courseService.js';
import { t } from '../i18n.js';
import CourseGeneratorModal from '../components/CourseGeneratorModal.jsx';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 250, damping: 22 } },
  exit: { opacity: 0, y: 10, transition: { duration: 0.15 } }
};

function DeleteConfirmModal({ isOpen, onClose, onConfirm, isDeleting }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={!isDeleting ? onClose : undefined}
            className="absolute inset-0 bg-black/80"
          />
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-sm bg-white dark:bg-[#1A1A1C] border border-zinc-200 dark:border-white/10 rounded-[16px] p-6 relative z-10 text-center font-sans shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
          >
            <div className="w-12 h-12 bg-[#2C0D0E]/50 border border-[#FF453A]/20 rounded-[12px] flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-[#FF453A]" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">{t('courses.confirmDeleteTitle') || 'Удалить курс?'}</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">{t('courses.confirmDeleteSubtitle') || 'Вы уверены, что хотите удалить этот курс? Это действие необратимо.'}</p>
            <div className="flex gap-3">
              <button disabled={isDeleting} onClick={onClose} className="flex-1 py-2.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-[12px] text-xs font-bold text-zinc-900 dark:text-white hover:bg-[#3A3A3C] transition-colors">
                {t('courses.cancel') || 'Отмена'}
              </button>
              <button disabled={isDeleting} onClick={onConfirm} className="flex-1 py-2.5 bg-[#FF453A] text-zinc-900 dark:text-white rounded-[12px] text-xs font-bold hover:bg-[#FF453A]/90 transition-colors flex justify-center items-center">
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : (t('courses.delete') || 'Удалить')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function CourseCard({ course, onDelete, viewMode }) {
  const navigate = useNavigate();

  const handleOpenClick = () => {
    localStorage.setItem('selected_course_id', course.id);
    navigate('/graph');
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(course.id);
  };

  const isCompleted = course.progress === 100;
  const cardGradient = course.gradient || 'from-indigo-500 to-purple-600';
  const isAi = course.category === '✨ Сгенерировано ИИ';

  const [cert, setCert] = useState(null);
  const [certLoading, setCertLoading] = useState(false);

  useEffect(() => {
    if (!isCompleted || !auth.currentUser) return;
    async function loadCert() {
      const existing = await getCourseCertificate(auth.currentUser.uid, course.id);
      if (existing) setCert(existing);
    }
    loadCert();
  }, [isCompleted, course.id]);

  const handleGetCert = async (e) => {
    e.stopPropagation();
    try {
      setCertLoading(true);
      const res = await requestCourseCertificate(course.id);
      if (res && res.fileUrl) {
        setCert({ fileUrl: res.fileUrl, certId: res.certId });
      }
    } catch (err) {
      console.error('Certificate error:', err);
    } finally {
      setCertLoading(false);
    }
  };

  if (viewMode === 'list') {
    return (
      <motion.div
        layout
        variants={cardVariants}
        onClick={handleOpenClick}
        className="bg-white dark:bg-[#1A1A1C] rounded-[20px] shadow-sm dark:shadow-none border border-gray-100 dark:border-white/5 p-4 flex flex-col md:flex-row items-center gap-5 transition-all duration-300 hover:shadow-lg dark:hover:border-white/20 hover:-translate-y-1 cursor-pointer group"
      >
        <div className={`w-20 h-20 rounded-[14px] bg-gradient-to-br ${cardGradient} flex items-center justify-center overflow-hidden flex-shrink-0 relative shadow-inner`}>
          <div className="absolute inset-0 bg-white/20 dark:bg-black/20 mix-blend-overlay"></div>
          {isAi ? (
            <Sparkles className="w-8 h-8 text-white drop-shadow-md relative z-10" strokeWidth={1.5} />
          ) : (
            <Brain className="w-8 h-8 text-white drop-shadow-md relative z-10" strokeWidth={1.5} />
          )}
        </div>
        
        <div className="flex-1 min-w-0 text-center md:text-left flex flex-col justify-center">
          <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start mb-1.5">
            <span className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full ${isAi ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400'}`}>
              {course.category}
            </span>
            <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 px-2 py-1 rounded-full border border-gray-200 dark:border-white/10">
              {t('level.' + ((course.level ? (course.level.charAt(0).toUpperCase() + course.level.slice(1).toLowerCase()) : 'Beginner'))).startsWith('level.') ? course.level : t('level.' + ((course.level ? (course.level.charAt(0).toUpperCase() + course.level.slice(1).toLowerCase()) : 'Beginner')))}
            </span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate font-clash">
            {t(course.title)}
          </h3>
        </div>

        <div className="w-40 flex-shrink-0 flex flex-col justify-center px-4 md:px-0">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-gray-500 dark:text-gray-400 font-medium">{isCompleted ? t('courses.completed') : t('courses.inProgress')}</span>
            <span className="text-gray-900 dark:text-white font-bold">{course.progress || 0}%</span>
          </div>
          <div className="w-full h-2.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden shadow-inner">
            <div 
              style={{ width: `${course.progress || 0}%` }}
              className={`h-full bg-gradient-to-r ${cardGradient} rounded-full transition-all duration-1000`}
            />
          </div>
        </div>

        <div className="flex items-center gap-5 flex-shrink-0 text-sm text-gray-500 dark:text-gray-400 font-medium justify-center md:justify-end px-2">
          <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-gray-400" strokeWidth={1.5} /> {course.hours || '0h'}</span>
          <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-gray-400" strokeWidth={1.5} /> {course.nodes?.length || 0}</span>
        </div>

        <button 
          onClick={handleDelete}
          className="absolute top-4 right-4 md:relative md:top-0 md:right-0 p-2.5 bg-red-50 dark:bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all opacity-100"
          title="Delete roadmap"
        >
          <Trash2 className="w-4 h-4" strokeWidth={2} />
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      variants={cardVariants}
      onClick={handleOpenClick}
      className="bg-white dark:bg-[#1A1A1C] rounded-[24px] shadow-sm dark:shadow-none border border-gray-100 dark:border-white/5 overflow-hidden transition-all duration-300 hover:shadow-xl dark:hover:border-white/20 hover:-translate-y-1.5 cursor-pointer flex flex-col h-full group"
    >
      <div className={`relative h-36 bg-gradient-to-br ${cardGradient} p-5 flex flex-col justify-between shrink-0 overflow-hidden`}>
        {/* Abstract shapes for visual interest */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/20 dark:bg-black/20 rounded-full blur-2xl mix-blend-overlay"></div>
        <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/20 dark:bg-black/20 rounded-full blur-xl mix-blend-overlay"></div>
        
        <div className="relative z-10 flex justify-between items-start">
          <span className={`inline-flex items-center backdrop-blur-md bg-white/20 dark:bg-black/20 border border-white/20 text-[10px] font-bold text-white px-2.5 py-1 rounded-full tracking-wider uppercase shadow-sm`}>
            {course.category}
          </span>
          <button 
            onClick={handleDelete}
            className="p-2 backdrop-blur-md bg-black/20 hover:bg-red-500/90 text-white rounded-xl transition-all opacity-100 border border-white/10"
            title="Delete roadmap"
          >
            <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
        </div>
        
        <div className="relative z-10 flex justify-between items-end mt-4">
          <div className="p-2.5 bg-white/20 dark:bg-black/20 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg">
            {isAi ? (
              <Sparkles className="w-6 h-6 text-white" strokeWidth={1.5} />
            ) : (
              <Brain className="w-6 h-6 text-white" strokeWidth={1.5} />
            )}
          </div>
          <span className="text-[11px] font-medium text-white/90 bg-black/20 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
            {t('level.' + ((course.level ? (course.level.charAt(0).toUpperCase() + course.level.slice(1).toLowerCase()) : 'Beginner'))).startsWith('level.') ? course.level : t('level.' + ((course.level ? (course.level.charAt(0).toUpperCase() + course.level.slice(1).toLowerCase()) : 'Beginner')))}
          </span>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col bg-white dark:bg-[#1A1A1C]">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-snug mb-2 font-clash line-clamp-2">
          {t(course.title)}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 line-clamp-2 leading-relaxed">
          {course.description || ''}
        </p>

        <div className="mt-auto space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2 text-xs font-medium">
              <span className="text-gray-500 dark:text-gray-400">{isCompleted ? t('courses.completed') : t('courses.inProgress')}</span>
              <span className="text-gray-900 dark:text-white font-bold">{course.progress || 0}%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden shadow-inner">
              <div 
                className={`h-full bg-gradient-to-r ${cardGradient} rounded-full transition-all duration-1000`}
                style={{ width: `${course.progress || 0}%` }}
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 font-medium border-t border-gray-100 dark:border-white/5 pt-4">
            <span className="flex items-center gap-1.5">
              <div className="p-1.5 bg-gray-50 dark:bg-white/5 rounded-lg">
                <Clock className="w-3.5 h-3.5" strokeWidth={2} />
              </div>
              {course.hours || '0h'}
            </span>
            <span className="flex items-center gap-1.5">
              <div className="p-1.5 bg-gray-50 dark:bg-white/5 rounded-lg">
                <BookOpen className="w-3.5 h-3.5" strokeWidth={2} />
              </div>
              {course.nodes?.length || 0} {t('courses.lessons')}
            </span>
          </div>

          {isCompleted && (
            <div className="pt-2" onClick={e => e.stopPropagation()}>
              {certLoading ? (
                <div className="flex items-center justify-center gap-2 py-2 bg-indigo-500/10 rounded-xl text-xs font-semibold text-indigo-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Генерация...</span>
                </div>
              ) : cert?.fileUrl ? (
                <div className="flex items-center gap-2">
                  <a
                    href={cert.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Скачать PDF</span>
                  </a>
                  <a
                    href={`#/verify/${cert.certId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-700 dark:text-white rounded-xl"
                    title="Проверить"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleGetCert}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-98"
                >
                  <Award className="w-4 h-4 text-amber-200" />
                  <span>Получить сертификат</span>
                </button>
              )}
            </div>
          )}
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

  // Filters & layout modes matching Apple style
  const [statusTab, setStatusTab] = useState('all'); // 'all' | 'active' | 'completed'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedLevels, setSelectedLevels] = useState([]);

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
    } finally {
      setIsDeleting(false);
    }
  };

  // Dynamic filter values
  const availableCategories = Array.from(new Set(userCourses.map(c => c.category).filter(Boolean)));
  const availableLevels = ['Beginner', 'Intermediate', 'Advanced'];

  const toggleCategory = (cat) => {
    setSelectedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const toggleLevel = (lvl) => {
    setSelectedLevels(prev => 
      prev.includes(lvl) ? prev.filter(l => l !== lvl) : [...prev, lvl]
    );
  };

  const filteredCourses = userCourses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesStatus = true;
    if (statusTab === 'active') matchesStatus = course.progress < 100;
    else if (statusTab === 'completed') matchesStatus = course.progress === 100;

    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(course.category);
    const matchesLevel = selectedLevels.length === 0 || selectedLevels.includes((course.level ? (course.level.charAt(0).toUpperCase() + course.level.slice(1).toLowerCase()) : 'Beginner'));

    return matchesSearch && matchesStatus && matchesCategory && matchesLevel;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-zinc-900 dark:text-white gap-4 w-full">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-900 dark:text-white" />
        <p className="text-sm font-medium tracking-wide font-clash">{t('courses.loadingCatalog')}</p>
      </div>
    );
  }

  return (
    <motion.main 
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="max-w-[2000px] mx-auto text-zinc-900 dark:text-white font-sans"
    >
      {/* Top Header */}
      <motion.div variants={cardVariants} className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold font-clash text-zinc-900 dark:text-white mb-2 tracking-tight">Курсы</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-xl">{t('courses.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowGenModal(true)}
          className="bg-zinc-900 !text-white hover:bg-zinc-800 dark:bg-white dark:!text-zinc-900 dark:hover:bg-zinc-200 px-6 py-3 rounded-[12px] font-bold text-xs transition-colors whitespace-nowrap flex items-center gap-2 font-sans"
        >
          <Sparkles className="w-4 h-4 fill-current" />
          {t('dashboard.generateCourse')}
        </button>
      </motion.div>

      {userCourses.length === 0 ? (
        /* Empty State */
        <motion.div 
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
          className="py-24 flex flex-col items-center justify-center text-center bg-white dark:bg-[#1A1A1C] border border-zinc-200 dark:border-white/10 rounded-[16px] shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
        >
          <div className="text-8xl font-bold font-mono text-zinc-900 dark:text-white mb-4">0</div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2 font-clash">{t('dashboard.noCourses')}</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-8 max-w-md">
            {t('dashboard.generateCustomDesc')}
          </p>
          <button
            onClick={() => setShowGenModal(true)}
            className="bg-zinc-900 !text-white hover:bg-zinc-800 dark:bg-white dark:!text-zinc-900 dark:hover:bg-zinc-200 px-8 py-3.5 rounded-[12px] font-bold text-xs transition-all flex items-center gap-2 font-sans"
          >
            <Sparkles className="w-4 h-4 fill-current" />
            {t('dashboard.generateFirst')}
          </button>
        </motion.div>
      ) : (
        /* Main Catalog Layout with Filter Column */
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Narrow Left Column Filters (20% width) */}
          <div className="w-full lg:w-48 flex-shrink-0 space-y-6">
            <div className="bg-white dark:bg-[#1A1A1C] border border-zinc-200 dark:border-white/10 rounded-[16px] p-4 space-y-6">
              {/* Category Filter */}
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-tight text-zinc-500 dark:text-zinc-400 mb-3 font-sans">Категории</h4>
                <div className="space-y-2">
                  {availableCategories.length === 0 ? (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Категории отсутствуют</p>
                  ) : (
                    availableCategories.map(cat => (
                      <label key={cat} className="flex items-center gap-3 cursor-pointer group select-none">
                        <div className="relative">
                          <input 
                            type="checkbox" 
                            checked={selectedCategories.includes(cat)} 
                            onChange={() => toggleCategory(cat)} 
                            className="sr-only" 
                          />
                          {/* iOS-style Checkbox checkbox (6px rounding) */}
                          <div className={`w-4 h-4 border rounded-[6px] transition-all flex items-center justify-center ${selectedCategories.includes(cat) ? "bg-indigo-600 border-indigo-600 text-white" : "border-zinc-300 dark:border-zinc-600 group-hover:border-indigo-400 bg-transparent"}`}>
                            {selectedCategories.includes(cat) && (
                              <svg viewBox="0 0 10 10" className="w-2 h-2 stroke-current stroke-[2] fill-none">
                                <polyline points="2,5.5 4,7.5 8,2.5" />
                              </svg>
                            )}
                          </div>
                        </div>
                        <span className={`text-xs transition-colors truncate max-w-[120px] ${cat === '✨ Сгенерировано ИИ' ? 'bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-indigo-400 font-extrabold group-hover:opacity-80' : 'text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:text-white'}`}>{cat}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Difficulty Level Filter */}
              <div className="border-t border-zinc-200 dark:border-white/10 pt-4">
                <h4 className="text-[10px] font-bold uppercase tracking-tight text-zinc-500 dark:text-zinc-400 mb-3 font-sans">Сложность</h4>
                <div className="space-y-2">
                  {availableLevels.map(lvl => (
                    <label key={lvl} className="flex items-center gap-3 cursor-pointer group select-none">
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          checked={selectedLevels.includes(lvl)} 
                          onChange={() => toggleLevel(lvl)} 
                          className="sr-only" 
                        />
                        {/* iOS-style Checkbox checkbox (6px rounding) */}
                        <div className={`w-4 h-4 border rounded-[6px] transition-all flex items-center justify-center ${selectedLevels.includes(lvl) ? "bg-indigo-600 border-indigo-600 text-white" : "border-zinc-300 dark:border-zinc-600 group-hover:border-indigo-400 bg-transparent"}`}>
                          {selectedLevels.includes(lvl) && (
                            <svg viewBox="0 0 10 10" className="w-2 h-2 stroke-current stroke-[2] fill-none">
                              <polyline points="2,5.5 4,7.5 8,2.5" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:text-white transition-colors">{t('level.' + lvl)}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column Catalog Content (80% width) */}
          <div className="flex-1 space-y-6">
            {/* Filter Bar: Tabs & View Swapper */}
            <motion.div variants={cardVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-white/10 pb-4">
              {/* Segmented capsule tabs for status */}
              <div className="segmented-container">
                {[
                  { id: 'all', label: 'Все' },
                  { id: 'active', label: 'В процессе' },
                  { id: 'completed', label: 'Завершённые' }
                ].map(tab => {
                  const isActive = statusTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setStatusTab(tab.id)}
                      className={`segmented-item ${isActive ? 'active' : ''}`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Search input + Segmented Layout View switcher */}
              <div className="flex items-center gap-4">
                <div className="relative w-48 md:w-60">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 dark:text-zinc-400" strokeWidth={1.5} />
                  <input 
                    type="text" 
                    placeholder={t('courses.search') || 'Поиск...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white dark:bg-[#1A1A1C] border border-zinc-200 dark:border-white/10 rounded-[12px] py-1.5 pl-8 pr-3 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:text-zinc-400 focus:outline-none focus:border-[rgba(255,255,255,0.3)] transition-colors"
                  />
                </div>
                
                {/* Segmented control view toggle switcher */}
                <div className="flex bg-white dark:bg-[#1A1A1C] rounded-[10px] p-0.5 border border-zinc-200 dark:border-white/10">
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-[8px] transition-colors ${viewMode === 'grid' ? 'bg-zinc-900 dark:bg-white !text-white dark:!text-zinc-900' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}
                    title="Сетка"
                  >
                    <Grid className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-[8px] transition-colors ${viewMode === 'list' ? 'bg-zinc-900 dark:bg-white !text-white dark:!text-zinc-900' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}
                    title="Список"
                  >
                    <ListIcon className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Catalog Grid / List */}
            <motion.div 
              layout 
              className={viewMode === 'list' ? 'flex flex-col gap-4 pb-8' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8'}
            >
              <AnimatePresence mode="popLayout">
                {filteredCourses.map((course) => (
                  <CourseCard 
                    key={course.id} 
                    course={course} 
                    onDelete={setCourseToDelete}
                    viewMode={viewMode}
                  />
                ))}
              </AnimatePresence>
              
              {filteredCourses.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="col-span-full py-20 flex flex-col items-center justify-center text-zinc-500 dark:text-zinc-400"
                >
                  <Search className="w-12 h-12 mb-4 opacity-20" strokeWidth={1.5} />
                  <p className="text-xs font-semibold">{t('courses.noMatching') || 'Совпадений не найдено'}</p>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
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
