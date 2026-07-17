import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, PlayCircle, FileCode2, GitBranch, BookOpen, Clock, User, Bookmark, BookmarkCheck } from 'lucide-react';
import { t, useLocale } from '../i18n.js';

const RESOURCE_TYPES = {
  article:    { icon: FileText,   color: 'bg-primary',   labelKey: 'resources.tabs.articles' },
  video:      { icon: PlayCircle, color: 'bg-error',     labelKey: 'resources.tabs.videos' },
  cheatsheet: { icon: FileCode2,  color: 'bg-tertiary',  labelKey: 'resources.tabs.cheatsheets' },
  repository: { icon: GitBranch,  color: 'bg-secondary', labelKey: 'resources.tabs.repos' },
};

import { auth } from '../firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { getUserCourses } from '../services/courseService.js';
import { useNavigate } from 'react-router-dom';const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
};

function ResourceCard({ resource, onClick }) {
  const [bookmarked, setBookmarked] = useState(false);
  const typeInfo = RESOURCE_TYPES[resource.type];
  const Icon = typeInfo.icon;

  return (
    <motion.div 
      layout
      variants={cardVariants}
      initial="hidden"
      animate="show"
      exit="exit"
      onClick={onClick}
      whileHover={{ y: -5, scale: 1.02 }}
      className="bg-surface rounded-2xl border border-outline-variant overflow-hidden shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 flex flex-col group cursor-pointer"
    >
      <div className={`${typeInfo.color} h-1.5 w-full`}></div>
      <div className="p-6 flex flex-col h-full">
        <div className="flex items-center gap-2 text-on-surface-variant mb-4">
          <Icon className="w-5 h-5" />
          <span className="text-xs uppercase tracking-wider font-bold">{t(typeInfo.labelKey)}</span>
        </div>
        
        <h3 className="text-xl font-bold text-on-surface leading-tight mb-3 group-hover:text-primary transition-colors">{resource.title}</h3>
        <p className="text-sm text-on-surface-variant mb-6 flex-1">{resource.desc}</p>
        
        <div className="flex flex-wrap gap-2 mb-6">
          {resource.tags.map(tag => (
            <span key={tag} className="bg-surface-container text-on-surface-variant text-xs font-semibold rounded-md px-2.5 py-1">
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-outline-variant/50">
          <div className="flex items-center gap-3 text-xs text-on-surface-variant font-medium">
            {resource.author && <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{resource.author}</span>}
            {resource.meta && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{resource.meta}</span>}
          </div>
          <motion.button 
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); setBookmarked(!bookmarked); }}
            className={`p-1.5 rounded-full transition-colors ${bookmarked ? 'text-primary bg-primary/10' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'}`}
          >
            {bookmarked ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

const TABS = [
  { id: 'All', labelKey: 'resources.tabs.all' },
  { id: 'Articles', labelKey: 'resources.tabs.articles' },
  { id: 'Videos', labelKey: 'resources.tabs.videos' },
  { id: 'Cheat Sheets', labelKey: 'resources.tabs.cheatsheets' },
  { id: 'Repositories', labelKey: 'resources.tabs.repos' },
];

export default function Resources() {
  const locale = useLocale();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('All');
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const courses = await getUserCourses(user.uid);
          const newResources = [];
          let idCounter = 1;
          
          courses.forEach(course => {
            if (course.nodes) {
              course.nodes.forEach(node => {
                newResources.push({
                  id: idCounter++,
                  type: 'article',
                  title: t(node.label),
                  desc: t(node.desc),
                  tags: [t(course.title)],
                  author: 'AI Mentor',
                  meta: t('nav.lessons'),
                  courseId: course.id,
                  nodeId: node.id
                });
              });
            }
          });
          setResources(newResources);
        } catch (e) {
          console.error("Failed to load resources:", e);
        } finally {
          setLoading(false);
        }
      } else {
        setResources([]);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [locale]);

  const filteredResources = resources.filter(r => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Articles' && r.type === 'article') return true;
    if (activeTab === 'Videos' && r.type === 'video') return true;
    if (activeTab === 'Cheat Sheets' && r.type === 'cheatsheet') return true;
    if (activeTab === 'Repositories' && r.type === 'repository') return true;
    return false;
  });

  return (
    <motion.main initial="hidden" animate="show" variants={containerVariants} className="p-4 md:p-8 max-w-7xl mx-auto">
      
      <motion.div variants={cardVariants} className="mb-10">
        <h1 className="text-4xl font-bold text-on-surface mb-3 tracking-tight">{t('resources.title')}</h1>
        <p className="text-lg text-on-surface-variant max-w-2xl">{t('resources.subtitle')}</p>
      </motion.div>

      {/* Featured Resource (Hide if empty) */}
      {resources.length > 0 && (
        <motion.div 
          onClick={() => {
            localStorage.setItem('selected_course_id', resources[0].courseId);
            navigate('/lessons');
          }}
          variants={cardVariants} 
          className="bg-surface rounded-3xl border border-outline-variant p-6 md:p-10 mb-10 shadow-lg relative overflow-hidden group cursor-pointer hover:border-primary/30 transition-colors"
        >
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[100px] rounded-full pointer-events-none group-hover:bg-primary/10 transition-colors duration-500"></div>
          <div className="flex flex-col md:flex-row gap-8 items-center relative z-10">
            <div className="w-full md:w-64 h-48 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center flex-shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-500">
              <BookOpen className="w-20 h-20 text-white/80" />
            </div>
            <div className="flex-1">
              <span className="text-xs font-bold text-primary bg-primary/10 rounded-full px-3 py-1 inline-block mb-3 uppercase tracking-wider">{t('resources.featured')}</span>
              <h2 className="text-3xl font-bold text-on-surface mb-3 group-hover:text-primary transition-colors">{resources[0].title}</h2>
              <p className="text-on-surface-variant leading-relaxed mb-6 max-w-2xl">
                {resources[0].desc}
              </p>
              <div className="flex items-center gap-6">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-primary text-on-primary rounded-xl px-6 py-3 font-bold shadow-lg shadow-primary/20 flex items-center gap-2">
                  <BookOpen className="w-5 h-5" /> {t('resources.readNow')}
                </motion.button>
                <div className="flex gap-4 text-sm font-medium text-on-surface-variant">
                  <span className="flex items-center gap-1.5"><User className="w-4 h-4" /> {resources[0].author}</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {resources[0].meta}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <motion.div variants={cardVariants} className="flex gap-2 mb-8 bg-surface-container rounded-xl p-1.5 overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-6 py-3 rounded-lg text-sm font-bold whitespace-nowrap transition-colors z-10 flex-1 ${
              activeTab === tab.id ? 'text-on-surface' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {activeTab === tab.id && (
              <motion.div 
                layoutId="resources-tab-pill"
                className="absolute inset-0 bg-surface rounded-lg z-[-1] shadow-sm"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            {t(tab.labelKey)}
          </button>
        ))}
      </motion.div>

      {/* Grid */}
      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
        <AnimatePresence mode="popLayout">
          {filteredResources.map(resource => (
            <ResourceCard 
              key={resource.id} 
              resource={resource} 
              onClick={() => {
                localStorage.setItem('selected_course_id', resource.courseId);
                navigate('/lessons');
              }}
            />
          ))}
          
          {!loading && filteredResources.length === 0 && (
            <div className="col-span-full py-12 text-center text-on-surface-variant">
              Нет доступных ресурсов. Создайте больше курсов!
            </div>
          )}
        </AnimatePresence>
      </motion.div>

    </motion.main>
  );
}
