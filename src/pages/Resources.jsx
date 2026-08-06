import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  PlayCircle, 
  FileCode2, 
  GitBranch, 
  BookOpen, 
  Clock, 
  User, 
  Bookmark, 
  BookmarkCheck,
  Search,
  Lock,
  Loader2,
  Laptop
} from 'lucide-react';
import { t, useLocale } from '../i18n.js';
import { auth } from '../firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { getUserCourses } from '../services/courseService.js';
import { useNavigate } from 'react-router-dom';
import { usePlanLimits } from '../hooks/usePlanLimits.js';
import ResourceModal from '../components/resources/ResourceModal.jsx';

const RESOURCE_TYPES = {
  article:    { icon: FileText,   label: 'PDF',   labelKey: 'resources.tabs.articles' },
  video:      { icon: PlayCircle, label: 'VIDEO', labelKey: 'resources.tabs.videos' },
  cheatsheet: { icon: FileCode2,  label: 'CODE',  labelKey: 'resources.tabs.cheatsheets' },
  repository: { icon: GitBranch,  label: 'LINK',  labelKey: 'resources.tabs.repos' },
  project:    { icon: Laptop,     label: 'PROJ',  labelKey: 'resources.tabs.projects' },
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 250, damping: 22 } },
  exit: { opacity: 0, y: 10, transition: { duration: 0.15 } }
};

function ResourceCard({ resource, onClick, isLocked }) {
  const [bookmarked, setBookmarked] = useState(false);
  const typeInfo = RESOURCE_TYPES[resource.type] || RESOURCE_TYPES.article;
  const Icon = typeInfo.icon;

  return (
    <motion.div 
      layout
      variants={cardVariants}
      onClick={onClick}
      className={`bg-surface rounded-[16px] border border-outline overflow-hidden transition-all duration-200 hover:border-[rgba(255,255,255,0.3)] flex flex-col h-full relative group cursor-pointer ${
        isLocked ? 'pointer-events-auto' : ''
      }`}
    >
      {/* Centered lock icon over locked card */}
      {isLocked && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/20 backdrop-blur-[1px]">
          <div className="w-10 h-10 bg-surface/80 border border-[rgba(255,255,255,0.1)] rounded-xl flex items-center justify-center text-on-surface shadow-lg">
            <Lock className="w-4.5 h-4.5" strokeWidth={1.5} />
          </div>
        </div>
      )}

      <div className={`flex flex-col h-full ${isLocked ? 'opacity-40 select-none pointer-events-none' : ''}`}>
        {/* Corner type badge */}
        <span className="absolute top-4 right-4 bg-surface-container border border-outline text-[9px] font-mono font-bold text-on-surface px-2 py-0.5 rounded-[4px] tracking-wider uppercase z-10">
          {typeInfo.label}
        </span>

        <div className="p-4 md:p-6 flex flex-col h-full">
          <div className="flex items-center gap-2 text-on-surface-variant mb-3 md:mb-4">
            <Icon className="w-4 h-4" strokeWidth={1.5} />
            <span className="text-[10px] uppercase tracking-wider font-mono font-bold">{t(typeInfo.labelKey)}</span>
          </div>
          
          <h3 className="text-base font-bold text-on-surface leading-tight mb-1.5 md:mb-2 group-hover:text-on-surface transition-colors font-clash line-clamp-2">
            {resource.title}
          </h3>
          <p className="text-xs text-on-surface-variant leading-relaxed mb-4 md:mb-6 flex-1 line-clamp-3">
            {resource.desc}
          </p>
          
          <div className="flex flex-wrap gap-1.5 mb-4 md:mb-6">
            {resource.tags.map(tag => (
              <span key={tag} className="bg-surface-container text-on-surface-variant border border-outline-variant text-[9px] font-mono font-bold rounded-[4px] px-2 py-0.5 uppercase tracking-wider">
                {tag}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between pt-3 md:pt-4 border-t border-outline mt-auto">
            <div className="flex items-center gap-2 text-[10px] text-on-surface-variant font-mono">
              {resource.author && <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" strokeWidth={1.5} />{resource.author}</span>}
              {resource.meta && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" strokeWidth={1.5} />{resource.meta}</span>}
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); setBookmarked(!bookmarked); }}
              className={`p-1.5 rounded-[6px] transition-colors ${bookmarked ? 'text-inverse-on-surface bg-on-surface' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'}`}
            >
              {bookmarked ? <BookmarkCheck className="w-4 h-4" strokeWidth={1.5} /> : <Bookmark className="w-4 h-4" strokeWidth={1.5} />}
            </button>
          </div>
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
  { id: 'Projects', labelKey: 'resources.tabs.projects' },
];

export default function Resources() {
  const locale = useLocale();
  const navigate = useNavigate();
  const { plan, loading: planLoading } = usePlanLimits();
  const [activeTab, setActiveTab] = useState('All');
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [lockedModalOpen, setLockedModalOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);
  const [activeResource, setActiveResource] = useState(null);

  useEffect(() => {
    setVisibleCount(5);
  }, [activeTab, searchQuery, selectedCategories]);

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
                const typeModulo = idCounter % 5;
                let rType = 'article';
                if (typeModulo === 0) rType = 'video';
                else if (typeModulo === 1) rType = 'cheatsheet';
                else if (typeModulo === 2) rType = 'repository';
                else if (typeModulo === 3) rType = 'project';
                
                newResources.push({
                  id: idCounter++,
                  type: rType,
                  title: t(node.label),
                  desc: t(node.desc) || 'Учебные материалы, сгенерированные AI-ассистентом для углублённого изучения темы.',
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

  const availableCategories = Array.from(new Set(resources.map(r => r.tags[0]).filter(Boolean)));

  const toggleCategory = (cat) => {
    setSelectedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const filteredResources = resources.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          r.desc.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesTab = true;
    if (activeTab === 'Articles') matchesTab = r.type === 'article';
    else if (activeTab === 'Videos') matchesTab = r.type === 'video';
    else if (activeTab === 'Cheat Sheets') matchesTab = r.type === 'cheatsheet';
    else if (activeTab === 'Repositories') matchesTab = r.type === 'repository';
    else if (activeTab === 'Projects') matchesTab = r.type === 'project';

    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(r.tags[0]);

    return matchesSearch && matchesTab && matchesCategory;
  });

  if (loading || planLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4.5rem)] bg-background text-on-surface">
        <Loader2 className="w-8 h-8 animate-spin text-on-surface mb-2" />
        <p className="text-sm text-on-surface-variant font-mono">Загрузка ресурсов...</p>
      </div>
    );
  }

  return (
    <motion.main 
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="max-w-[2000px] mx-auto text-on-background font-sans p-4 md:p-6 w-full min-w-0 overflow-x-hidden"
    >
      <motion.div variants={cardVariants} className="mb-10">
        <h1 className="text-4xl font-bold font-clash text-on-surface mb-2 tracking-tight">{t('resources.title')}</h1>
        <p className="text-sm text-on-surface-variant max-w-xl">{t('resources.subtitle')}</p>
      </motion.div>

      {/* Featured Resource */}
      {resources.length > 0 && (
        <motion.div 
          onClick={() => {
            const isFeaturedLocked = plan === 'FREE';
            if (isFeaturedLocked) {
              setLockedModalOpen(true);
              return;
            }
            if (resources[0].type === 'video') {
              window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(resources[0].tags[0] + ' ' + resources[0].title + ' tutorial')}`, '_blank');
            } else if (resources[0].type === 'repository') {
              window.open(`https://github.com/search?q=${encodeURIComponent(resources[0].title)}`, '_blank');
            } else {
              setActiveResource(resources[0]);
            }
          }}
          variants={cardVariants} 
          className="bg-surface border border-outline rounded-[16px] p-6 md:p-8 mb-10 flex flex-col md:flex-row gap-8 items-center relative overflow-hidden group cursor-pointer hover:border-[rgba(255,255,255,0.3)] transition-colors"
        >
          {/* Featured resource is the first material and is unlocked */}
          
          {/* Grayscale geometry card decoration */}
          <div className="w-full md:w-48 h-32 rounded-[12px] bg-surface-container/40 border border-outline flex items-center justify-center flex-shrink-0 relative overflow-hidden">
            <svg className="absolute inset-0 w-full h-full text-on-surface opacity-10 stroke-current stroke-[0.5] fill-none" viewBox="0 0 100 40" preserveAspectRatio="none">
              <line x1="0" y1="0" x2="100" y2="40" />
              <line x1="0" y1="40" x2="100" y2="0" />
              <circle cx="50" cy="20" r="10" />
            </svg>
            <BookOpen className="w-10 h-10 text-on-surface opacity-40 relative z-10" strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[9px] font-mono font-bold text-inverse-on-surface bg-on-surface rounded-[4px] px-2.5 py-0.5 inline-block mb-3 uppercase tracking-tight">{t('resources.featured')}</span>
            <h2 className="text-xl font-bold text-on-surface mb-2 group-hover:text-on-surface transition-colors font-clash truncate">{resources[0].title}</h2>
            <p className="text-xs text-on-surface-variant leading-relaxed mb-6 max-w-2xl line-clamp-2">
              {resources[0].desc}
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <button className="bg-on-surface hover:bg-surface-container text-inverse-on-surface rounded-[12px] px-5 py-2.5 text-xs font-bold transition-colors flex items-center gap-2 self-start font-sans">
                <BookOpen className="w-4 h-4" strokeWidth={1.5} /> {t('resources.readNow')}
              </button>
              <div className="flex gap-4 text-[10px] font-mono text-on-surface-variant">
                <span className="flex items-center gap-1.5"><User className="w-4 h-4" strokeWidth={1.5} /> {resources[0].author}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" strokeWidth={1.5} /> {resources[0].meta}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Catalog layout with narrow left filters */}
      {resources.length === 0 ? (
        <div className="py-20 text-center bg-surface border border-outline rounded-[16px] text-on-surface-variant font-sans">
          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" strokeWidth={1.5} />
          <p className="text-sm font-semibold">Нет доступных ресурсов</p>
          <p className="text-xs text-on-surface-variant/60 mt-1">Создайте хотя бы один курс, чтобы сгенерировать библиотеку ресурсов.</p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8 w-full min-w-0">
          {/* Narrow Left Column Filters (20% width) */}
          <div className="w-full lg:w-48 flex-shrink-0 space-y-6">
            <div className="bg-surface border border-outline rounded-[16px] p-4">
              <h4 className="text-[10px] font-bold uppercase tracking-tight text-on-surface-variant mb-3 font-sans">Курсы</h4>
              <div className="space-y-2">
                {availableCategories.length === 0 ? (
                  <p className="text-xs text-on-surface-variant">Категории отсутствуют</p>
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
                        <div className={`w-4 h-4 border rounded-[6px] transition-all flex items-center justify-center ${selectedCategories.includes(cat) ? 'bg-on-surface border-[#FFFFFF]' : 'border-outline group-hover:border-[rgba(255,255,255,0.3)] bg-transparent'}`}>
                          {selectedCategories.includes(cat) && (
                            <svg viewBox="0 0 10 10" className="w-2 h-2 stroke-[#000000] stroke-[2] fill-none">
                              <polyline points="2,5.5 4,7.5 8,2.5" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-on-surface-variant group-hover:text-on-background transition-colors truncate max-w-[120px]">{cat}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column Catalog Content (80% width) */}
          <div className="flex-1 space-y-6 min-w-0 w-full">
            {/* Search + Tabs Bar */}
            <div className="space-y-4">
              {/* Borderless bottom line search field */}
              <div className="relative border border-outline rounded-xl bg-surface focus-within:border-white focus-within:bg-surface-container-high transition-all py-3 px-4 shadow-sm flex items-center gap-3">
                <Search className="w-4 h-4 text-on-surface-variant" strokeWidth={1.5} />
                <input
                  type="text"
                  placeholder="Поиск ресурсов..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none"
                />
              </div>

              {/* iOS Segmented Control Tabs */}
              <div className="segmented-container w-full overflow-x-auto pb-0.5">
                {TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`segmented-item ${isActive ? 'active' : ''}`}
                    >
                      {t(tab.labelKey)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Resources Grid */}
            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
              <AnimatePresence mode="popLayout">
                {(() => {
                  const seenCourseIds = {};
                  const displayedResources = activeTab === 'All' ? filteredResources.slice(0, visibleCount) : filteredResources;
                  return displayedResources.map((resource) => {
                    const cId = resource.courseId;
                    if (!seenCourseIds[cId]) {
                      seenCourseIds[cId] = 0;
                    }
                    seenCourseIds[cId]++;
                    const isLocked = plan === 'FREE' && seenCourseIds[cId] > 1;
                    return (
                      <ResourceCard 
                        key={resource.id} 
                        resource={resource} 
                        isLocked={isLocked}
                        onClick={() => {
                          if (isLocked) {
                            setLockedModalOpen(true);
                            return;
                          }
                          if (resource.type === 'video') {
                            window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(resource.tags[0] + ' ' + resource.title + ' tutorial')}`, '_blank');
                          } else if (resource.type === 'repository') {
                            window.open(`https://github.com/search?q=${encodeURIComponent(resource.title)}`, '_blank');
                          } else {
                            setActiveResource(resource);
                          }
                        }}
                      />
                    );
                  });
                })()}
              </AnimatePresence>
              
              {activeTab === 'All' && filteredResources.length > visibleCount && (
                <div className="col-span-full flex justify-center mt-2 mb-4">
                  <button 
                    onClick={() => setVisibleCount(prev => prev + 10)}
                    className="bg-surface-container-high hover:bg-[#3C3C3E] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-colors border border-outline shadow-sm"
                  >
                    Показать остальные
                  </button>
                </div>
              )}
              
              {!loading && filteredResources.length === 0 && (
                <div className="col-span-full py-16 text-center text-on-surface-variant font-sans">
                  <Search className="w-8 h-8 mx-auto mb-3 opacity-20" strokeWidth={1.5} />
                  <p className="text-xs font-semibold">Совпадений не найдено</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}

      {/* Resource Locked Upsell Modal */}
      <AnimatePresence>
        {lockedModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLockedModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="relative bg-surface border border-outline w-full max-w-sm rounded-[2rem] p-6 shadow-2xl z-10 text-center"
            >
              <div className="w-12 h-12 bg-on-surface/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Lock className="w-5 h-5 text-on-surface" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-bold text-on-surface mb-2">Ресурс доступен в Pro</h3>
              <p className="text-xs text-on-surface-variant mb-6 leading-relaxed">
                Этот материал является эксклюзивной Pro-частью вашего курса. Обновите тарифный план для получения безлимитного доступа ко всем ресурсам.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setLockedModalOpen(false);
                    navigate('/pricing');
                  }}
                  className="w-full py-3 rounded-xl font-bold bg-on-surface text-inverse-on-surface hover:bg-[#F5F5F7] transition-all text-xs"
                >
                  Узнать о Pro
                </button>
                <button
                  onClick={() => setLockedModalOpen(false)}
                  className="w-full py-3 rounded-xl font-bold bg-transparent border border-outline text-on-surface hover:bg-[rgba(255,255,255,0.04)] transition-all text-xs"
                >
                  Понятно
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Dynamic AI Resource Modal */}
      <AnimatePresence>
        {activeResource && (
          <ResourceModal resource={activeResource} onClose={() => setActiveResource(null)} />
        )}
      </AnimatePresence>
    </motion.main>
  );
}
