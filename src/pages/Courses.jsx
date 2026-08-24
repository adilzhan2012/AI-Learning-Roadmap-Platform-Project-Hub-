import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Brain, 
  Clock, 
  BookOpen, 
  Loader2,
  Sparkles,
  Trash2,
  Grid,
  List as ListIcon,
  Award,
  Download,
  ExternalLink,
  Pin,
  CheckSquare,
  Check,
  X,
  ArrowUpDown,
  Filter,
  ChevronDown,
  Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { getUserCourses, deleteCourse, toggleCoursePin, requestCourseCertificate, getCourseCertificate, getCourseById } from '../services/courseService.js';
import { t, useLocale } from '../i18n.js';
import CourseGeneratorModal from '../components/courses/CourseGeneratorModal.jsx';
import CreateGroupModal from '../components/groups/CreateGroupModal.jsx';
import ManageGroupModal from '../components/groups/ManageGroupModal.jsx';
import { useUserGroups } from '../hooks/useUserGroups.js';
import { removeGroupMember, deleteGroup } from '../services/groupService.js';
import { usePlanLimits } from '../hooks/usePlanLimits.js';
import { getSubjectTheme, formatCourseHours, getSubjectLabel, classifyCourseSubject } from '../utils/courseSubjectClassifier.js';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 250, damping: 22 } },
  exit: { opacity: 0, y: 10, transition: { duration: 0.15 } }
};

function SortSelector({ value, onChange }) {
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const options = [
    { id: 'date_desc', label: locale === 'en' ? 'Newest first' : (t('courses.sort.newest') || 'Новые сначала') },
    { id: 'date_asc', label: locale === 'en' ? 'Oldest first' : (t('courses.sort.oldest') || 'Старые сначала') },
    { id: 'title_asc', label: locale === 'en' ? 'Alphabetical (A–Z)' : (t('courses.sort.az') || 'По алфавиту (А–Я)') },
    { id: 'title_desc', label: locale === 'en' ? 'Alphabetical (Z–A)' : (t('courses.sort.za') || 'По алфавиту (Я–А)') },
    { id: 'progress_desc', label: locale === 'en' ? 'Highest progress' : (t('courses.sort.progressDesc') || 'По прогрессу (высокий → низкий)') },
    { id: 'progress_asc', label: locale === 'en' ? 'Lowest progress' : (t('courses.sort.progressAsc') || 'По прогрессу (низкий → высокий)') }
  ];

  const selectedOption = options.find(o => o.id === value) || options[0];

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative flex-1 sm:w-52" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-white dark:bg-[#1A1A1C] border border-zinc-300 dark:border-white/15 text-zinc-800 dark:text-zinc-200 rounded-[12px] py-2 px-3 text-xs font-semibold shadow-2xs hover:border-indigo-400 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span className="truncate">{selectedOption.label}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-[#1A1A1C] border border-zinc-200 dark:border-white/15 rounded-[14px] shadow-xl py-1.5 overflow-hidden text-xs"
          >
            {options.map(opt => {
              const isSelected = opt.id === value;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 transition-colors flex items-center justify-between ${
                    isSelected 
                      ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-bold' 
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 font-medium'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-indigo-600 dark:text-indigo-400" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DeleteConfirmModal({ isOpen, onClose, onConfirm, isDeleting, count = 1 }) {
  const locale = useLocale();
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={!isDeleting ? onClose : undefined}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-sm bg-white dark:bg-[#1A1A1C] border border-zinc-200 dark:border-white/10 rounded-[16px] p-6 relative z-10 text-center font-sans shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
          >
            <div className="w-12 h-12 bg-[#2C0D0E]/50 border border-[#FF453A]/20 rounded-[12px] flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-[#FF453A]" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">
              {count > 1 
                ? (locale === 'en' ? `Delete selected courses (${count})?` : `Удалить выбранные курсы (${count})?`) 
                : (t('courses.confirmDeleteTitle') || (locale === 'en' ? 'Delete Course?' : 'Удалить курс?'))}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">
              {count > 1 
                ? (locale === 'en' 
                    ? `Are you sure you want to permanently delete ${count} selected courses? This action cannot be undone.` 
                    : `Вы уверены, что хотите полностью удалить ${count} выбранных курсов? Они будут окончательно сотрете из базы данных.`)
                : (t('courses.confirmDeleteSubtitle') || (locale === 'en' 
                    ? 'Are you sure you want to delete this course? This action cannot be undone.' 
                    : 'Вы уверены, что хотите удалить этот курс? Это действие необратимо.'))}
            </p>
            <div className="flex gap-3">
              <button disabled={isDeleting} onClick={onClose} className="flex-1 py-2.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-[12px] text-xs font-bold text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-[#3A3A3C] transition-colors cursor-pointer">
                {locale === 'en' ? 'Cancel' : (t('courses.cancel') || 'Отмена')}
              </button>
              <button disabled={isDeleting} onClick={onConfirm} className="flex-1 py-2.5 bg-[#FF453A] text-white rounded-[12px] text-xs font-bold hover:bg-[#FF453A]/90 transition-colors flex justify-center items-center cursor-pointer">
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : (locale === 'en' ? 'Delete' : (t('courses.delete') || 'Удалить'))}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function CourseCard({ 
  course, 
  onDelete, 
  onTogglePin, 
  viewMode, 
  plan,
  isSelectionMode,
  isSelected,
  onSelectToggle,
  onOpenGroupModal,
  courseGroup,
  onManageGroup
}) {
  const navigate = useNavigate();
  const locale = useLocale();
  const detectedSubject = classifyCourseSubject(course.topic, course.title, course.nodes);
  const effectiveSubject = (detectedSubject && detectedSubject !== 'Общее') ? detectedSubject : (course.subject || 'Общее');
  const theme = getSubjectTheme(effectiveSubject, course.topic, course.title, course.nodes);
  const SubjectIcon = theme.icon;
  const subjectLabel = getSubjectLabel(effectiveSubject, locale);

  const handleCardClick = (e) => {
    if (isSelectionMode) {
      e.stopPropagation();
      onSelectToggle(course.id);
      return;
    }
    localStorage.setItem('selected_course_id', course.id);
    navigate('/graph');
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(course.id);
  };

  const handlePin = (e) => {
    e.stopPropagation();
    onTogglePin(course.id, !course.isPinned);
  };

  const isCompleted = course.progress === 100;
  const formattedHours = formatCourseHours(course.hours, locale);

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

  const translatedLevel = t('level.' + ((course.level ? (course.level.charAt(0).toUpperCase() + course.level.slice(1).toLowerCase()) : 'Beginner'))).startsWith('level.') ? course.level : t('level.' + ((course.level ? (course.level.charAt(0).toUpperCase() + course.level.slice(1).toLowerCase()) : 'Beginner')));

  if (viewMode === 'list') {
    return (
      <motion.div
        variants={cardVariants}
        onClick={handleCardClick}
        className={`relative w-full bg-white dark:bg-[#1A1A1C] rounded-[18px] sm:rounded-[20px] shadow-sm border p-3.5 sm:p-4 flex flex-row items-center justify-between gap-3 sm:gap-4 transition-all duration-300 hover:shadow-md cursor-pointer group ${
          theme.borderClass
        } ${
          isSelected 
            ? 'ring-2 ring-indigo-500 bg-indigo-500/5 dark:bg-indigo-500/10' 
            : course.isPinned
            ? 'border-amber-400/60 dark:border-amber-400/40 bg-amber-500/5'
            : 'border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20'
        }`}
      >
        {/* Selection Checkbox Overlay */}
        {isSelectionMode && (
          <div className="shrink-0 z-20">
            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-black/30 border-white/40 text-transparent'}`}>
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          </div>
        )}

        {/* Icon */}
        <div className={`w-11 h-11 sm:w-14 sm:h-14 rounded-[12px] sm:rounded-[14px] bg-gradient-to-br ${theme.accentGradient} flex items-center justify-center overflow-hidden shrink-0 shadow-md`}>
          <SubjectIcon className="w-5 h-5 sm:w-7 sm:h-7 text-white drop-shadow-md relative z-10" strokeWidth={1.75} />
        </div>
        
        {/* Main info */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            {course.isPinned && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full shrink-0">
                <Pin className="w-3 h-3 fill-amber-500" />
                {locale === 'en' ? 'Pinned' : 'Закреплен'}
              </span>
            )}
            <span className={`inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full border ${theme.bgBadgeClass} shrink-0`}>
              <SubjectIcon className="w-3 h-3" strokeWidth={2} />
              <span className="truncate max-w-[110px] sm:max-w-none">{subjectLabel}</span>
            </span>
            <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-white/5 px-2 py-0.5 rounded-full border border-zinc-200 dark:border-white/10 shrink-0">
              {translatedLevel}
            </span>
          </div>

          <h3 className="text-xs sm:text-base font-bold text-zinc-900 dark:text-white truncate font-clash group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {t(course.title)}
          </h3>

          {/* Subtext info for mobile / tablet */}
          <div className="flex items-center gap-3 text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
            <span>{isCompleted ? t('courses.completed') : `${course.progress || 0}%`}</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formattedHours}</span>
            <span>•</span>
            <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {course.nodes?.length || 0} {locale === 'en' ? 'lessons' : (t('courses.lessons') || 'уроков')}</span>
          </div>
        </div>

        {/* Progress bar on desktop */}
        <div className="hidden lg:flex w-36 shrink-0 flex-col justify-center">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-zinc-500 dark:text-zinc-400 font-medium">{isCompleted ? t('courses.completed') : t('courses.inProgress')}</span>
            <span className="text-zinc-900 dark:text-white font-bold">{course.progress || 0}%</span>
          </div>
          <div className="w-full h-2 bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden shadow-inner">
            <div 
              style={{ width: `${course.progress || 0}%` }}
              className={`h-full bg-gradient-to-r ${theme.accentGradient} rounded-full transition-all duration-1000`}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {courseGroup ? (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onManageGroup && onManageGroup(courseGroup);
              }}
              className="p-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 rounded-xl transition-all border border-indigo-500/20 cursor-pointer"
              title={locale === 'en' ? 'Manage group' : 'Управление группой'}
            >
              <Users className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2} />
            </button>
          ) : (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onOpenGroupModal && onOpenGroupModal(course);
              }}
              className="p-2 bg-zinc-100 dark:bg-white/5 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-zinc-400 hover:text-indigo-500 rounded-xl transition-all cursor-pointer"
              title={locale === 'en' ? 'Study with friends' : 'Пройти с друзьями'}
            >
              <Users className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2} />
            </button>
          )}
          <button 
            onClick={handlePin}
            className={`p-2 rounded-xl transition-all cursor-pointer ${course.isPinned ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' : 'bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-400 hover:text-amber-400'}`}
            title={course.isPinned ? (locale === 'en' ? 'Unpin' : 'Открепить') : (locale === 'en' ? 'Pin' : 'Закрепить')}
          >
            <Pin className={`w-3.5 h-3.5 ${course.isPinned ? 'fill-amber-500' : ''}`} strokeWidth={2} />
          </button>
          <button 
            onClick={handleDelete}
            className="p-2 bg-red-50 dark:bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all cursor-pointer"
            title={locale === 'en' ? 'Delete course' : 'Удалить курс'}
          >
            <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={cardVariants}
      onClick={handleCardClick}
      className={`relative bg-white dark:bg-[#1A1A1C] rounded-[22px] shadow-sm dark:shadow-none border overflow-hidden transition-all duration-300 hover:shadow-xl cursor-pointer flex flex-col h-full group ${
        theme.borderClass
      } ${
        isSelected 
          ? 'ring-2 ring-indigo-500 bg-indigo-500/5' 
          : course.isPinned
          ? 'border-amber-400/60 dark:border-amber-400/30'
          : 'border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20'
      }`}
    >
      {/* Top Header Card Section */}
      <div className="p-4 sm:p-5 pb-3 flex items-center justify-between gap-2 border-b border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.02]">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0 flex-1">
          {isSelectionMode ? (
            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-black/20 border-zinc-400 text-transparent'}`}>
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          ) : (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border shadow-sm ${theme.bgBadgeClass}`}>
              <SubjectIcon className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
              <span className="truncate">{subjectLabel}</span>
            </span>
          )}
          
          <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 px-2.5 py-1 rounded-full shadow-2xs shrink-0">
            {translatedLevel}
          </span>

          {course.isPinned && (
            <span className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
              <Pin className="w-3 h-3 fill-amber-500" />
              {locale === 'en' ? 'Pinned' : 'Закреплен'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {courseGroup ? (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onManageGroup && onManageGroup(courseGroup);
              }}
              className="p-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 rounded-lg transition-all border border-indigo-500/20 cursor-pointer"
              title={locale === 'en' ? 'Manage group' : 'Управление группой'}
            >
              <Users className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          ) : (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onOpenGroupModal && onOpenGroupModal(course);
              }}
              className="p-1.5 bg-white dark:bg-white/5 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-zinc-400 hover:text-indigo-500 rounded-lg transition-all border border-zinc-200 dark:border-white/10 cursor-pointer"
              title={locale === 'en' ? 'Study with friends' : 'Пройти с друзьями'}
            >
              <Users className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          )}
          <button 
            onClick={handlePin}
            className={`p-1.5 rounded-lg transition-all border cursor-pointer ${course.isPinned ? 'bg-amber-500/20 border-amber-500/30 text-amber-500' : 'bg-white dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 border-zinc-200 dark:border-white/10 text-zinc-400 hover:text-amber-500'}`}
            title={course.isPinned ? (locale === 'en' ? 'Unpin' : 'Открепить') : (locale === 'en' ? 'Pin' : 'Закрепить')}
          >
            <Pin className={`w-3.5 h-3.5 ${course.isPinned ? 'fill-amber-500' : ''}`} strokeWidth={2} />
          </button>
          <button 
            onClick={handleDelete}
            className="p-1.5 bg-white dark:bg-white/5 hover:bg-red-500 text-zinc-400 hover:text-white rounded-lg transition-all border border-zinc-200 dark:border-white/10 cursor-pointer"
            title={locale === 'en' ? 'Delete course' : 'Удалить курс'}
          >
            <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between bg-white dark:bg-[#1A1A1C]">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white leading-snug mb-2 font-clash line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {t(course.title)}
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-300 mb-4 sm:mb-5 line-clamp-2 leading-relaxed font-sans">
            {course.description || (locale === 'en' ? 'Interactive study course and knowledge roadmap.' : 'Учебный курс и интерактивная дорожная карта знания.')}
          </p>
        </div>

        <div className="space-y-4 pt-2">
          {/* Progress */}
          <div>
            <div className="flex items-center justify-between mb-1.5 text-xs font-semibold">
              <span className="text-zinc-500 dark:text-zinc-400">{isCompleted ? t('courses.completed') : t('courses.inProgress')}</span>
              <span className="text-zinc-900 dark:text-white font-bold">{course.progress || 0}%</span>
            </div>
            <div className="w-full h-2 bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden shadow-inner">
              <div 
                className={`h-full bg-gradient-to-r ${theme.accentGradient} rounded-full transition-all duration-1000`}
                style={{ width: `${course.progress || 0}%` }}
              />
            </div>
          </div>
          
          {/* Bottom metadata */}
          <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-300 font-medium border-t border-zinc-100 dark:border-white/5 pt-3.5">
            <span className="flex items-center gap-1.5">
              <div className="p-1 bg-zinc-100 dark:bg-white/5 rounded-md text-zinc-400">
                <Clock className="w-3.5 h-3.5" strokeWidth={2} />
              </div>
              {formattedHours}
            </span>
            <span className="flex items-center gap-1.5">
              <div className="p-1 bg-zinc-100 dark:bg-white/5 rounded-md text-zinc-400">
                <BookOpen className="w-3.5 h-3.5" strokeWidth={2} />
              </div>
              {course.nodes?.length || 0} {locale === 'en' ? 'lessons' : (t('courses.lessons') || 'уроков')}
            </span>
          </div>

          {/* Certificate options if 100% completed */}
          {isCompleted && (
            <div className="pt-2" onClick={e => e.stopPropagation()}>
              {certLoading ? (
                <div className="flex items-center justify-center gap-2 py-2 bg-indigo-500/10 rounded-xl text-xs font-semibold text-indigo-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{locale === 'en' ? 'Generating...' : 'Генерация...'}</span>
                </div>
              ) : cert?.fileUrl ? (
                <div className="flex items-center gap-2">
                  <a
                    href={cert.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{locale === 'en' ? 'Download PDF' : 'Скачать PDF'}</span>
                  </a>
                  <a
                    href={`#/verify/${cert.certId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-zinc-100 dark:bg-white/10 hover:bg-zinc-200 dark:hover:bg-white/20 text-zinc-700 dark:text-white rounded-xl cursor-pointer"
                    title={locale === 'en' ? 'Verify' : 'Проверить'}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1 w-full">
                  <button
                    type="button"
                    onClick={handleGetCert}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-98 cursor-pointer"
                  >
                    <Award className="w-4 h-4 text-amber-200" />
                    <span>{locale === 'en' ? 'Get Certificate' : 'Получить сертификат'}</span>
                  </button>
                  {plan === 'FREE' && (
                    <span className="text-[9px] text-zinc-500 dark:text-zinc-400 text-center leading-tight mt-1">
                      {locale === 'en' ? 'Upgrade to Pro for QR verification & PDF' : 'Upgrade to Pro для QR-верификации и PDF'}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function Courses() {
  const navigate = useNavigate();
  const locale = useLocale();
  const { plan } = usePlanLimits();
  const [user, setUser] = useState(auth.currentUser);
  const [userCourses, setUserCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showGenModal, setShowGenModal] = useState(false);
  const [groupModalCourse, setGroupModalCourse] = useState(null);
  
  const { groups: userGroups } = useUserGroups();
  const [manageGroup, setManageGroup] = useState(null);

  // Gallery multi-selection & pin states
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedCourseIds, setSelectedCourseIds] = useState(new Set());
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Layout & Navigation controls
  const [statusTab, setStatusTab] = useState('all'); // 'all' | 'active' | 'completed'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [sortBy, setSortBy] = useState('date_desc'); // 'date_desc' | 'date_asc' | 'title_asc' | 'title_desc' | 'progress_desc' | 'progress_asc'

  // Filter chips state
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedLevels, setSelectedLevels] = useState([]);

  const loadUserAndGroupCourses = async (uid, groups) => {
    let fetched = await getUserCourses(uid);
    if (groups && groups.length > 0) {
      const fetchedIds = new Set(fetched.map(c => c.id));
      const missingGroupCourseIds = groups
        .map(g => g.courseId)
        .filter(id => id && !fetchedIds.has(id));
      
      const groupCourses = [];
      for (const cId of missingGroupCourseIds) {
        try {
          const gc = await getCourseById(cId);
          if (gc) groupCourses.push(gc);
        } catch {
          // Course was deleted or unavailable, ignore safely
        }
      }
      fetched = [...fetched, ...groupCourses];
    }
    return fetched;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    const fetchCourses = async () => {
      try {
        const fetched = await loadUserAndGroupCourses(user.uid, userGroups);
        if (mounted) {
          setUserCourses(fetched);
          setLoading(false);
        }
      } catch (e) {
        console.error("Error loading user courses:", e);
        if (mounted) setLoading(false);
      }
    };
    fetchCourses();
    return () => { mounted = false; };
  }, [user, userGroups]);

  const refreshCourses = async () => {
    if (!user) return;
    try {
      const fetched = await loadUserAndGroupCourses(user.uid, userGroups);
      setUserCourses(fetched);
    } catch (e) {
      console.error("Error refreshing courses:", e);
    }
  };

  const confirmSingleDelete = async () => {
    if (!user || !courseToDelete) return;
    setIsDeleting(true);
    try {
      await deleteCourse(courseToDelete, user.uid);
      setUserCourses(prev => prev.filter(c => c.id !== courseToDelete));
      setSelectedCourseIds(prev => {
        const next = new Set(prev);
        next.delete(courseToDelete);
        return next;
      });
      setCourseToDelete(null);
    } catch (e) {
      console.error("Failed to delete course:", e);
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmBulkDelete = async () => {
    if (!user || selectedCourseIds.size === 0) return;
    setIsDeleting(true);
    try {
      for (const id of selectedCourseIds) {
        await deleteCourse(id, user.uid);
      }
      setUserCourses(prev => prev.filter(c => !selectedCourseIds.has(c.id)));
      setSelectedCourseIds(new Set());
      setIsSelectionMode(false);
      setIsBulkDeleteModalOpen(false);
    } catch (e) {
      console.error("Failed bulk delete:", e);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTogglePin = async (courseId, isPinned) => {
    if (!user) return;
    try {
      await toggleCoursePin(courseId, user.uid, isPinned);
      setUserCourses(prev => prev.map(c => c.id === courseId ? { ...c, isPinned } : c));
    } catch (e) {
      console.error("Failed to toggle pin:", e);
    }
  };

  const handleBulkPinToggle = async () => {
    if (!user || selectedCourseIds.size === 0) return;
    const selectedCourses = userCourses.filter(c => selectedCourseIds.has(c.id));
    const allPinned = selectedCourses.every(c => c.isPinned);
    const targetPinned = !allPinned;

    try {
      for (const id of selectedCourseIds) {
        await toggleCoursePin(id, user.uid, targetPinned);
      }
      setUserCourses(prev => prev.map(c => selectedCourseIds.has(c.id) ? { ...c, isPinned: targetPinned } : c));
    } catch (e) {
      console.error("Failed bulk pin toggle:", e);
    }
  };

  const toggleSelectCourse = (id) => {
    setSelectedCourseIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedCourseIds.size === sortedFilteredCourses.length) {
      setSelectedCourseIds(new Set());
    } else {
      setSelectedCourseIds(new Set(sortedFilteredCourses.map(c => c.id)));
    }
  };

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedCourseIds(new Set());
  };

  // Dynamic filter lists
  const availableSubjects = Array.from(new Set(userCourses.map(c => c.subject).filter(Boolean)));
  const availableLevels = ['Beginner', 'Intermediate', 'Advanced'];

  const toggleSubjectChip = (subj) => {
    setSelectedSubjects(prev =>
      prev.includes(subj) ? prev.filter(s => s !== subj) : [...prev, subj]
    );
  };

  const toggleLevelChip = (lvl) => {
    setSelectedLevels(prev =>
      prev.includes(lvl) ? prev.filter(l => l !== lvl) : [...prev, lvl]
    );
  };

  // Filter logic
  const filteredCourses = userCourses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (course.subject || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesStatus = true;
    if (statusTab === 'active') matchesStatus = (course.progress || 0) < 100;
    else if (statusTab === 'completed') matchesStatus = (course.progress || 0) === 100;

    // OR logic inside subject group
    const matchesSubject = selectedSubjects.length === 0 || selectedSubjects.includes(course.subject);

    // OR logic inside level group
    const normalizedCourseLevel = course.level ? (course.level.charAt(0).toUpperCase() + course.level.slice(1).toLowerCase()) : 'Beginner';
    const matchesLevel = selectedLevels.length === 0 || selectedLevels.includes(normalizedCourseLevel);

    // AND logic between groups
    return matchesSearch && matchesStatus && matchesSubject && matchesLevel;
  });

  // Sorting logic (pinned always on top)
  const sortedFilteredCourses = [...filteredCourses].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;

    if (sortBy === 'date_desc') {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    }
    if (sortBy === 'date_asc') {
      return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    }
    if (sortBy === 'title_asc') {
      return (a.title || '').localeCompare(b.title || '');
    }
    if (sortBy === 'title_desc') {
      return (b.title || '').localeCompare(a.title || '');
    }
    if (sortBy === 'progress_desc') {
      return (b.progress || 0) - (a.progress || 0);
    }
    if (sortBy === 'progress_asc') {
      return (a.progress || 0) - (b.progress || 0);
    }
    return 0;
  });

  const selectedList = userCourses.filter(c => selectedCourseIds.has(c.id));
  const allSelectedArePinned = selectedList.length > 0 && selectedList.every(c => c.isPinned);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-zinc-900 dark:text-white gap-4 w-full">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-900 dark:text-white" />
        <p className="text-sm font-medium tracking-wide font-clash">{t('courses.loadingCatalog') || 'Loading courses...'}</p>
      </div>
    );
  }

  return (
    <motion.main 
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="max-w-[2000px] mx-auto text-zinc-900 dark:text-white font-sans pb-24 relative px-4 sm:px-6 pt-6 sm:pt-8"
    >
      {/* Top Header */}
      <motion.div variants={cardVariants} className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold font-clash text-zinc-900 dark:text-white mb-1 tracking-tight">
            {t('nav.courses') || 'Courses'}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm max-w-xl">{t('courses.subtitle')}</p>
        </div>
        
        <div className="flex items-center gap-2.5">
          {userCourses.length > 0 && (
            <button
              onClick={() => {
                if (isSelectionMode) {
                  exitSelectionMode();
                } else {
                  setIsSelectionMode(true);
                }
              }}
              className={`flex-1 sm:flex-none justify-center px-4 py-2.5 rounded-[12px] font-bold text-xs transition-all flex items-center gap-2 font-sans border shadow-sm cursor-pointer ${
                isSelectionMode 
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-md' 
                  : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-white/15 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              <CheckSquare className="w-4 h-4 shrink-0" />
              <span className="truncate">
                {isSelectionMode ? (locale === 'en' ? 'Cancel' : (t('common.cancel') || 'Отмена')) : (locale === 'en' ? 'Batch Select' : (t('courses.batchSelect') || 'Выбрать'))}
              </span>
            </button>
          )}
          <button
            onClick={() => setShowGenModal(true)}
            className="flex-1 sm:flex-none justify-center bg-zinc-900 !text-white hover:bg-zinc-800 dark:bg-white dark:!text-zinc-900 dark:hover:bg-zinc-200 px-5 sm:px-6 py-2.5 rounded-[12px] font-bold text-xs transition-colors whitespace-nowrap flex items-center gap-2 font-sans shadow-sm cursor-pointer"
          >
            <Sparkles className="w-4 h-4 fill-current shrink-0" />
            <span>{t('dashboard.generateCourse')}</span>
          </button>
        </div>
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
            className="bg-zinc-900 !text-white hover:bg-zinc-800 dark:bg-white dark:!text-zinc-900 dark:hover:bg-zinc-200 px-8 py-3.5 rounded-[12px] font-bold text-xs transition-all flex items-center gap-2 font-sans cursor-pointer"
          >
            <Sparkles className="w-4 h-4 fill-current" />
            {t('dashboard.generateFirst')}
          </button>
        </motion.div>
      ) : (
        /* Full Width Catalog Layout */
        <div className="space-y-4 sm:space-y-6">
          {/* Top Control Bar: Status Tabs, Search, Sort & View Mode */}
          <motion.div variants={cardVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-white/10 pb-4">
            {/* Status Capsule Tabs */}
            <div className="segmented-container max-w-full overflow-x-auto no-scrollbar">
              {[
                { id: 'all', label: locale === 'en' ? 'All Courses' : (t('courses.filter.all') || 'Все') },
                { id: 'active', label: locale === 'en' ? 'Active' : (t('courses.filter.active') || 'В процессе') },
                { id: 'completed', label: locale === 'en' ? 'Completed' : (t('courses.filter.completed') || 'Завершённые') }
              ].map(tab => {
                const isActive = statusTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setStatusTab(tab.id)}
                    className={`segmented-item whitespace-nowrap cursor-pointer ${isActive ? 'active' : ''}`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Search, Custom Sort Selector & View Mode Switcher */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
              {/* Search input */}
              <div className="relative flex-1 sm:w-60">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" strokeWidth={1.5} />
                <input 
                  type="text" 
                  placeholder={locale === 'en' ? 'Search courses...' : (t('courses.search') || 'Поиск...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white dark:bg-[#1A1A1C] border border-zinc-300 dark:border-white/15 rounded-[12px] py-2 pl-9 pr-3 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-indigo-500 transition-colors shadow-2xs"
                />
              </div>

              <div className="flex items-center gap-2.5">
                {/* Custom Animated Sort Selector */}
                <SortSelector value={sortBy} onChange={setSortBy} />

                {/* View Mode Toggle Switcher */}
                <div className="flex bg-zinc-100 dark:bg-zinc-800/80 rounded-[12px] p-1 border border-zinc-200 dark:border-white/10 shadow-2xs shrink-0">
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-[8px] transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm border border-zinc-200/60 dark:border-white/10' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}
                    title={locale === 'en' ? 'Grid' : 'Сетка'}
                  >
                    <Grid className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-[8px] transition-all cursor-pointer ${viewMode === 'list' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm border border-zinc-200/60 dark:border-white/10' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}
                    title={locale === 'en' ? 'List' : 'Список'}
                  >
                    <ListIcon className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Horizontal Chip Filter Rows */}
          <motion.div variants={cardVariants} className="space-y-4 bg-white dark:bg-[#1A1A1C] border border-zinc-200 dark:border-white/10 rounded-[18px] p-4 shadow-sm">
            {/* Subject Chips */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-indigo-500" />
                <span>{locale === 'en' ? 'Course Topic' : 'Тема курса'}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setSelectedSubjects([])}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                    selectedSubjects.length === 0 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' 
                      : 'bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:border-indigo-400'
                  }`}
                >
                  {locale === 'en' ? 'All Topics' : 'Все темы'}
                </button>

                {availableSubjects.map(subj => {
                  const isSelected = selectedSubjects.includes(subj);
                  const label = getSubjectLabel(subj, locale);
                  return (
                    <button
                      key={subj}
                      onClick={() => toggleSubjectChip(subj)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                          : 'bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:border-indigo-400'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Level Chips */}
            <div className="border-t border-zinc-100 dark:border-white/5 pt-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">
                <span>{locale === 'en' ? 'Difficulty' : 'Сложность'}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setSelectedLevels([])}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                    selectedLevels.length === 0 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' 
                      : 'bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:border-indigo-400'
                  }`}
                >
                  {locale === 'en' ? 'All Levels' : 'Любая сложность'}
                </button>

                {availableLevels.map(lvl => {
                  const isSelected = selectedLevels.includes(lvl);
                  const translated = t('level.' + lvl);
                  return (
                    <button
                      key={lvl}
                      onClick={() => toggleLevelChip(lvl)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                          : 'bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:border-indigo-400'
                      }`}
                    >
                      {translated}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Catalog Grid / List */}
          <div 
            className={viewMode === 'list' ? 'flex flex-col gap-4 pb-8 w-full' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 pb-8 w-full'}
          >
            <AnimatePresence>
              {sortedFilteredCourses.map((course) => (
                <CourseCard 
                  key={`${course.id}-${viewMode}`} 
                  course={course} 
                  onDelete={setCourseToDelete}
                  onTogglePin={handleTogglePin}
                  viewMode={viewMode}
                  plan={plan}
                  isSelectionMode={isSelectionMode}
                  isSelected={selectedCourseIds.has(course.id)}
                  onSelectToggle={toggleSelectCourse}
                  onOpenGroupModal={(c) => setGroupModalCourse(c)}
                  courseGroup={userGroups?.find(g => g.courseId === course.id)}
                  onManageGroup={(g) => setManageGroup(g)}
                />
              ))}
            </AnimatePresence>
            
            {sortedFilteredCourses.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="col-span-full py-16 sm:py-20 flex flex-col items-center justify-center text-zinc-500 dark:text-zinc-400 bg-white dark:bg-[#1A1A1C] border border-zinc-200 dark:border-white/10 rounded-[20px] text-center px-4"
              >
                <Search className="w-10 h-10 sm:w-12 sm:h-12 mb-3 opacity-20" strokeWidth={1.5} />
                <p className="text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300">{t('courses.noMatching') || (locale === 'en' ? 'No courses found for selected filters' : 'Курсов по выбранным фильтрам не найдено')}</p>
                <button 
                  onClick={() => { setSelectedSubjects([]); setSelectedLevels([]); setSearchQuery(''); setStatusTab('all'); }}
                  className="mt-3 text-xs text-indigo-500 hover:underline font-medium cursor-pointer"
                >
                  {locale === 'en' ? 'Reset all filters' : 'Сбросить все фильтры'}
                </button>
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* Floating Gallery Bulk Action Bar */}
      <AnimatePresence>
        {(isSelectionMode || selectedCourseIds.size > 0) && (
          <motion.div 
            initial={{ y: 60, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.95 }}
            className="fixed bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-[90] bg-zinc-900/95 dark:bg-[#1A1A1C]/95 backdrop-blur-xl border border-zinc-700 dark:border-white/15 text-white px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl shadow-2xl flex items-center gap-3 sm:gap-4 text-xs font-bold font-sans max-w-[92vw] overflow-x-auto no-scrollbar"
          >
            <div className="flex items-center gap-1.5 sm:gap-2 pr-3 border-r border-white/15 shrink-0">
              <CheckSquare className="w-4 h-4 text-indigo-400" />
              <span>Выбрано: {selectedCourseIds.size}</span>
            </div>

            <button
              onClick={handleBulkPinToggle}
              disabled={selectedCourseIds.size === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 disabled:opacity-50 rounded-xl transition-all shrink-0"
            >
              <Pin className={`w-3.5 h-3.5 ${allSelectedArePinned ? 'fill-amber-400 text-amber-400' : 'text-amber-300'}`} />
              <span className="whitespace-nowrap">{allSelectedArePinned ? 'Открепить' : 'Закрепить'}</span>
            </button>

            <button
              onClick={() => setIsBulkDeleteModalOpen(true)}
              disabled={selectedCourseIds.size === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 disabled:opacity-50 rounded-xl transition-all shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">Удалить ({selectedCourseIds.size})</span>
            </button>

            <button
              onClick={toggleSelectAll}
              className="px-2.5 py-1.5 text-zinc-400 hover:text-white transition-all shrink-0 whitespace-nowrap"
            >
              {selectedCourseIds.size === sortedFilteredCourses.length ? 'Снять выделение' : 'Выбрать все'}
            </button>

            <button
              onClick={exitSelectionMode}
              className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-all ml-1 shrink-0"
              title="Закрыть выбор"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <CourseGeneratorModal 
        isOpen={showGenModal} 
        onClose={() => setShowGenModal(false)} 
        userUid={user?.uid} 
        onCourseGenerated={refreshCourses}
      />

      <CreateGroupModal
        isOpen={!!groupModalCourse}
        onClose={() => setGroupModalCourse(null)}
        courseId={groupModalCourse?.id}
        courseTitle={groupModalCourse?.title || groupModalCourse?.topic}
        onGroupCreated={(newGroupId) => {
          if (groupModalCourse?.id) {
            localStorage.setItem('selected_course_id', groupModalCourse.id);
            navigate(`/graph?courseId=${groupModalCourse.id}&groupId=${newGroupId}`);
          }
        }}
      />

      {/* Single Delete Modal */}
      <DeleteConfirmModal 
        isOpen={!!courseToDelete}
        onClose={() => setCourseToDelete(null)}
        onConfirm={confirmSingleDelete}
        isDeleting={isDeleting}
        count={1}
      />

      {/* Bulk Delete Modal */}
      <DeleteConfirmModal 
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={confirmBulkDelete}
        isDeleting={isDeleting}
        count={selectedCourseIds.size}
      />

      <ManageGroupModal
        isOpen={!!manageGroup}
        onClose={() => setManageGroup(null)}
        group={manageGroup}
        onRemoveMember={removeGroupMember}
        onDeleteGroup={deleteGroup}
      />
    </motion.main>
  );
}
