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
  List as ListIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { getUserCourses, deleteCourse } from '../services/courseService.js';
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
            className="w-full max-w-sm bg-[#1C1C1E] border border-[rgba(255,255,255,0.08)] rounded-[16px] p-6 relative z-10 text-center font-sans shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
          >
            <div className="w-12 h-12 bg-[#2C0D0E]/50 border border-[#FF453A]/20 rounded-[12px] flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-[#FF453A]" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-bold text-[#F5F5F7] mb-2">{t('courses.confirmDeleteTitle') || 'Удалить курс?'}</h3>
            <p className="text-xs text-[#98989D] mb-6">{t('courses.confirmDeleteSubtitle') || 'Вы уверены, что хотите удалить этот курс? Это действие необратимо.'}</p>
            <div className="flex gap-3">
              <button disabled={isDeleting} onClick={onClose} className="flex-1 py-2.5 bg-[#2C2C2E] border border-[rgba(255,255,255,0.08)] rounded-[12px] text-xs font-bold text-[#F5F5F7] hover:bg-[#3A3A3C] transition-colors">
                {t('courses.cancel') || 'Отмена'}
              </button>
              <button disabled={isDeleting} onClick={onConfirm} className="flex-1 py-2.5 bg-[#FF453A] text-white rounded-[12px] text-xs font-bold hover:bg-[#FF453A]/90 transition-colors flex justify-center items-center">
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

  if (viewMode === 'list') {
    return (
      <motion.div
        layout
        variants={cardVariants}
        onClick={handleOpenClick}
        className="bg-[#1C1C1E] rounded-[16px] border border-[rgba(255,255,255,0.08)] p-4 flex flex-col md:flex-row items-center gap-4 transition-all duration-200 hover:border-[rgba(255,255,255,0.3)] cursor-pointer"
      >
        <div className="w-16 h-16 bg-[#2C2C2E]/50 border border-[rgba(255,255,255,0.08)] rounded-[12px] flex items-center justify-center overflow-hidden flex-shrink-0 relative">
          <svg className="absolute inset-0 w-full h-full text-[#FFFFFF] opacity-10 stroke-current stroke-[0.5] fill-none" viewBox="0 0 40 40">
            <line x1="0" y1="0" x2="40" y2="40" />
            <circle cx="20" cy="20" r="10" />
          </svg>
          <Brain className="w-6 h-6 text-[#FFFFFF] opacity-40 relative z-10" strokeWidth={1.5} />
        </div>
        
        <div className="flex-1 min-w-0 text-center md:text-left">
          <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start">
            <span className="text-[9px] font-mono font-bold text-[#98989D] tracking-wider uppercase border border-[rgba(255,255,255,0.08)] px-1.5 py-0.5 rounded-[4px]">
              {course.category}
            </span>
            <span className="text-[9px] font-mono text-[#98989D]">
              {t('level.' + (course.level || 'Beginner'))}
            </span>
          </div>
          <h3 className="text-base font-bold text-[#FFFFFF] mt-1.5 truncate font-clash">
            {t(course.title)}
          </h3>
        </div>

        <div className="w-32 flex-shrink-0">
          <div className="flex justify-between text-[11px] font-mono mb-1 text-[#98989D]">
            <span>{isCompleted ? t('courses.completed') : t('courses.inProgress')}</span>
            <span className="text-[#FFFFFF] font-bold">{course.progress || 0}%</span>
          </div>
          <div className="w-full h-[2px] bg-[#2C2C2E] border border-[rgba(255,255,255,0.04)] rounded-sm overflow-hidden">
            <div 
              style={{ width: `${course.progress || 0}%` }}
              className="h-full bg-[#FFFFFF]"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0 text-xs text-[#98989D] font-mono">
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" strokeWidth={1.5} /> {course.hours || '0h'}</span>
          <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" strokeWidth={1.5} /> {course.nodes?.length || 0}</span>
        </div>

        <button 
          onClick={handleDelete}
          className="p-2 bg-[#2C0D0E]/50 hover:bg-[#FF453A] border border-transparent hover:border-[#FF453A]/20 hover:text-white text-[#FF453A] rounded-[8px] transition-colors md:opacity-0 group-hover:opacity-100"
          title="Delete roadmap"
        >
          <Trash2 className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      variants={cardVariants}
      onClick={handleOpenClick}
      className="bg-[#1C1C1E] rounded-[16px] border border-[rgba(255,255,255,0.08)] overflow-hidden transition-all duration-200 hover:border-[rgba(255,255,255,0.3)] cursor-pointer flex flex-col h-full group"
    >
      <div className="relative h-28 bg-[#2C2C2E]/50 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-center overflow-hidden shrink-0">
        <svg className="absolute inset-0 w-full h-full text-[#FFFFFF] opacity-10 stroke-current stroke-[0.5] fill-none" viewBox="0 0 100 40" preserveAspectRatio="none">
          <line x1="0" y1="0" x2="100" y2="40" />
          <line x1="0" y1="40" x2="100" y2="0" />
          <circle cx="50" cy="20" r="10" />
        </svg>
        <Brain className="w-8 h-8 text-[#FFFFFF] opacity-40 relative z-10" strokeWidth={1} />
        
        <span className="absolute top-3 left-3 bg-[#1C1C1E] border border-[rgba(255,255,255,0.08)] text-[9px] font-mono font-bold text-[#98989D] px-2 py-0.5 rounded-[4px] tracking-wider uppercase">
          {course.category}
        </span>
        <button 
          onClick={handleDelete}
          className="absolute top-3 right-3 bg-[#2C0D0E]/50 hover:bg-[#FF453A] text-[#FF453A] hover:text-white p-1.5 rounded-[8px] border border-transparent hover:border-[#FF453A]/20 transition-all opacity-0 group-hover:opacity-100"
          title="Delete roadmap"
        >
          <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
        </button>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <h3 className="text-base font-bold text-[#FFFFFF] leading-snug mb-2 font-clash line-clamp-2">
          {t(course.title)}
        </h3>
        <p className="text-xs text-[#98989D] mb-6 line-clamp-2">{course.description || ''}</p>

        <div className="mt-auto">
          <div className="flex items-center justify-between mb-1.5 text-[11px] font-mono text-[#98989D]">
            <span>{isCompleted ? t('courses.completed') : t('courses.inProgress')}</span>
            <span className="text-[#FFFFFF] font-bold">{course.progress || 0}%</span>
          </div>
          <div className="w-full h-[2px] bg-[#2C2C2E] border border-[rgba(255,255,255,0.04)] rounded-sm overflow-hidden mb-4">
            <div 
              className="h-full bg-[#FFFFFF]"
              style={{ width: `${course.progress || 0}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#98989D] font-mono border-t border-[rgba(255,255,255,0.04)] pt-3">
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" strokeWidth={1.5} /> {course.hours || '0h'}</span>
            <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" strokeWidth={1.5} /> {course.nodes?.length || 0} {t('courses.lessons')}</span>
          </div>
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
    const matchesLevel = selectedLevels.length === 0 || selectedLevels.includes(course.level || 'Beginner');

    return matchesSearch && matchesStatus && matchesCategory && matchesLevel;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#000000] text-[#F5F5F7] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#FFFFFF]" />
        <p className="text-sm font-medium tracking-wide font-clash">{t('courses.loadingCatalog')}</p>
      </div>
    );
  }

  return (
    <motion.main 
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="max-w-[2000px] mx-auto text-[#F5F5F7] font-sans"
    >
      {/* Top Header */}
      <motion.div variants={cardVariants} className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold font-clash text-[#FFFFFF] mb-2 tracking-tight">Курсы</h1>
          <p className="text-[#98989D] text-sm max-w-xl">{t('courses.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowGenModal(true)}
          className="bg-[#FFFFFF] hover:bg-[#E8E8ED] text-[#000000] px-6 py-3 rounded-[12px] font-bold text-xs transition-colors whitespace-nowrap flex items-center gap-2 font-sans"
        >
          <Sparkles className="w-4 h-4 fill-current text-[#000000]" />
          {t('dashboard.generateCourse')}
        </button>
      </motion.div>

      {userCourses.length === 0 ? (
        /* Empty State */
        <motion.div 
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
          className="py-24 flex flex-col items-center justify-center text-center bg-[#1C1C1E] border border-[rgba(255,255,255,0.08)] rounded-[16px] shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
        >
          <div className="text-8xl font-bold font-mono text-[#FFFFFF] mb-4">0</div>
          <h2 className="text-xl font-bold text-[#FFFFFF] mb-2 font-clash">{t('dashboard.noCourses')}</h2>
          <p className="text-xs text-[#98989D] mb-8 max-w-md">
            {t('dashboard.generateCustomDesc')}
          </p>
          <button
            onClick={() => setShowGenModal(true)}
            className="bg-[#FFFFFF] hover:bg-[#E8E8ED] text-[#000000] px-8 py-3.5 rounded-[12px] font-bold text-xs transition-all flex items-center gap-2 font-sans"
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
            <div className="bg-[#1C1C1E] border border-[rgba(255,255,255,0.08)] rounded-[16px] p-4 space-y-6">
              {/* Category Filter */}
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-tight text-[#98989D] mb-3 font-sans">Категории</h4>
                <div className="space-y-2">
                  {availableCategories.length === 0 ? (
                    <p className="text-xs text-[#98989D]">Категории отсутствуют</p>
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
                          <div className={`w-4 h-4 border rounded-[6px] transition-all flex items-center justify-center ${selectedCategories.includes(cat) ? 'bg-[#FFFFFF] border-[#FFFFFF]' : 'border-[rgba(255,255,255,0.15)] group-hover:border-[rgba(255,255,255,0.3)] bg-transparent'}`}>
                            {selectedCategories.includes(cat) && (
                              <svg viewBox="0 0 10 10" className="w-2 h-2 stroke-[#000000] stroke-[2] fill-none">
                                <polyline points="2,5.5 4,7.5 8,2.5" />
                              </svg>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-[#98989D] group-hover:text-[#F5F5F7] transition-colors truncate max-w-[120px]">{cat}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Difficulty Level Filter */}
              <div className="border-t border-[rgba(255,255,255,0.08)] pt-4">
                <h4 className="text-[10px] font-bold uppercase tracking-tight text-[#98989D] mb-3 font-sans">Сложность</h4>
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
                        <div className={`w-4 h-4 border rounded-[6px] transition-all flex items-center justify-center ${selectedLevels.includes(lvl) ? 'bg-[#FFFFFF] border-[#FFFFFF]' : 'border-[rgba(255,255,255,0.15)] group-hover:border-[rgba(255,255,255,0.3)] bg-transparent'}`}>
                          {selectedLevels.includes(lvl) && (
                            <svg viewBox="0 0 10 10" className="w-2 h-2 stroke-[#000000] stroke-[2] fill-none">
                              <polyline points="2,5.5 4,7.5 8,2.5" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-[#98989D] group-hover:text-[#F5F5F7] transition-colors">{t('level.' + lvl)}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column Catalog Content (80% width) */}
          <div className="flex-1 space-y-6">
            {/* Filter Bar: Tabs & View Swapper */}
            <motion.div variants={cardVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[rgba(255,255,255,0.08)] pb-4">
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
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#98989D]" strokeWidth={1.5} />
                  <input 
                    type="text" 
                    placeholder={t('courses.search') || 'Поиск...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#1C1C1E] border border-[rgba(255,255,255,0.08)] rounded-[12px] py-1.5 pl-8 pr-3 text-xs text-[#F5F5F7] placeholder:text-[#98989D] focus:outline-none focus:border-[rgba(255,255,255,0.3)] transition-colors"
                  />
                </div>
                
                {/* Segmented control view toggle switcher */}
                <div className="flex bg-[#1C1C1E] rounded-[10px] p-0.5 border border-[rgba(255,255,255,0.04)]">
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-[8px] transition-colors ${viewMode === 'grid' ? 'bg-[#FFFFFF] text-[#000000]' : 'text-[#98989D] hover:text-[#F5F5F7]'}`}
                    title="Сетка"
                  >
                    <Grid className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-[8px] transition-colors ${viewMode === 'list' ? 'bg-[#FFFFFF] text-[#000000]' : 'text-[#98989D] hover:text-[#F5F5F7]'}`}
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
                  className="col-span-full py-20 flex flex-col items-center justify-center text-[#98989D]"
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
