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
  Laptop,
  Sparkles,
  Star
} from 'lucide-react';
import { t, useLocale } from '../i18n.js';
import { auth } from '../firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { getUserCourses, getUserStats } from '../services/courseService.js';
import { useNavigate } from 'react-router-dom';
import { usePlanLimits } from '../hooks/usePlanLimits.js';
import ResourceModal from '../components/resources/ResourceModal.jsx';
import ExternalResourceModal from '../components/resources/ExternalResourceModal.jsx';
import { determineResourceType, getResourceAccess, fetchCuratedExternalResources, getResourceRatings } from '../services/resourceService.js';

const RESOURCE_TYPES = {
  article:    { icon: FileText,   badgeKey: 'resources.badges.article',    tabKey: 'resources.tabs.articles', estimate: '5 мин чтение' },
  video:      { icon: PlayCircle, badgeKey: 'resources.badges.video',      tabKey: 'resources.tabs.videos', estimate: '10 мин просмотр' },
  cheatsheet: { icon: FileCode2,  badgeKey: 'resources.badges.cheatsheet', tabKey: 'resources.tabs.cheatsheets', estimate: '3 мин шпаргалка' },
  repository: { icon: GitBranch,  badgeKey: 'resources.badges.repository', tabKey: 'resources.tabs.repos', estimate: '15 мин код' },
  project:    { icon: Laptop,     badgeKey: 'resources.badges.project',    tabKey: 'resources.tabs.projects', estimate: '20 мин практика' },
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

function ResourceCard({ resource, onClick, isLocked, userPlan }) {
  const [bookmarked, setBookmarked] = useState(false);
  const [utilityInfo, setUtilityInfo] = useState(null);

  const typeInfo = RESOURCE_TYPES[resource.type] || RESOURCE_TYPES.article;
  const Icon = typeInfo.icon;

  useEffect(() => {
    let isMounted = true;
    const resId = resource.id || `${resource.courseId}_${resource.nodeId}`;
    getResourceRatings(resId).then(info => {
      if (isMounted && info.utilityPercentage !== null) {
        setUtilityInfo(info.utilityPercentage);
      }
    });
    return () => { isMounted = false; };
  }, [resource]);

  return (
    <motion.div 
      layout
      variants={cardVariants}
      onClick={onClick}
      className={`bg-surface rounded-[16px] border border-outline overflow-hidden transition-all duration-200 hover:border-[rgba(255,255,255,0.3)] flex flex-col h-full relative group cursor-pointer ${
        isLocked ? 'pointer-events-auto' : ''
      }`}
    >
      {/* Centered Lock Banner for locked cards */}
      {isLocked && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/60 backdrop-blur-[2px] p-4 text-center">
          <div className="w-10 h-10 bg-surface/90 border border-white/10 rounded-2xl flex items-center justify-center text-amber-400 shadow-xl mb-2">
            <Lock className="w-4.5 h-4.5" strokeWidth={1.5} />
          </div>
          <span className="text-xs font-bold text-white mb-1">Доступно в PRO</span>
          <span className="text-[10px] text-on-surface-variant max-w-[160px]">Разблокируйте полный курс и все материалы</span>
        </div>
      )}

      <div className={`flex flex-col h-full ${isLocked ? 'opacity-40 select-none pointer-events-none' : ''}`}>
        {/* Corner Type Badge */}
        <span className="absolute top-4 right-4 bg-surface-container border border-outline text-[9px] font-mono font-bold text-on-surface px-2.5 py-0.5 rounded-[6px] tracking-wider uppercase z-10">
          {t(typeInfo.badgeKey)}
        </span>

        <div className="p-4 md:p-6 flex flex-col h-full">
          <div className="flex items-center justify-between text-on-surface-variant mb-3 md:mb-4">
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-indigo-400" strokeWidth={1.5} />
              <span className="text-[10px] uppercase tracking-wider font-mono font-bold">{t(typeInfo.tabKey)}</span>
            </div>
            {utilityInfo !== null && (
              <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-bold">
                {utilityInfo}% полезности
              </span>
            )}
          </div>
          
          <h3 className="text-base font-bold text-on-surface leading-tight mb-1.5 md:mb-2 group-hover:text-indigo-300 transition-colors font-clash line-clamp-2">
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
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" strokeWidth={1.5} />{typeInfo.estimate}</span>
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
  const { plan, loading: planLoading, setUpgradeModalOpen } = usePlanLimits();
  const [userProfile, setUserProfile] = useState({});
  const [activeTab, setActiveTab] = useState('All');
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [lockedModalOpen, setLockedModalOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(6);
  
  // Active modals state
  const [activeResource, setActiveResource] = useState(null);
  const [externalModalData, setExternalModalData] = useState(null); // { resource, externalData, loading }

  useEffect(() => {
    setVisibleCount(6);
  }, [activeTab, searchQuery, selectedCategories]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const [courses, stats] = await Promise.all([
            getUserCourses(user.uid),
            getUserStats(user.uid).catch(() => ({}))
          ]);
          setUserProfile(stats || {});

          const newResources = [];
          let idCounter = 1;
          
          courses.forEach(course => {
            if (course.nodes) {
              course.nodes.forEach((node, nodeIdx) => {
                // Lazy-fallback for node resource types
                const resourceTypes = node.resourceTypes || determineResourceType(node);
                
                resourceTypes.forEach((rType, typeIdx) => {
                  newResources.push({
                    id: `${course.id}_${node.id}_${typeIdx}`,
                    numericId: idCounter++,
                    type: rType,
                    title: t(node.label),
                    desc: node.desc || `Практические и теоретические материалы ИИ-ментора по теме ${t(node.label)}.`,
                    tags: [t(course.title)],
                    courseId: course.id,
                    nodeId: node.id,
                    rawNode: node,
                    nodeIdx,
                    typeIdx
                  });
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

  const handleCardClick = async (resource, isLocked) => {
    if (isLocked) {
      setUpgradeModalOpen(true);
      return;
    }

    if (resource.type === 'video' || resource.type === 'repository') {
      setExternalModalData({ resource, externalData: null, loading: true });
      try {
        const ext = await fetchCuratedExternalResources({
          topicLabel: resource.title,
          courseTitle: resource.tags[0],
          lessonContent: resource.rawNode?.content,
          resourceType: resource.type,
          userPlan: plan,
          existingCandidates: resource.rawNode?.externalCandidates
        });
        setExternalModalData({ resource, externalData: ext, loading: false });
      } catch (err) {
        console.warn("External fetch error:", err);
        setExternalModalData({ resource, externalData: { candidates: [], isPersonalized: false }, loading: false });
      }
    } else {
      setActiveResource(resource);
    }
  };

  if (loading || planLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4.5rem)] bg-background text-on-surface">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mb-2" />
        <p className="text-sm text-on-surface-variant font-mono">Загрузка адаптивной библиотеки ресурсов...</p>
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
      <motion.div variants={cardVariants} className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold font-clash text-on-surface mb-2 tracking-tight">{t('resources.title')}</h1>
          <p className="text-sm text-on-surface-variant max-w-xl">{t('resources.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-xl self-start md:self-auto">
          <Sparkles className="w-3.5 h-3.5" /> Тариф: <span className="font-bold text-white uppercase">{plan}</span>
        </div>
      </motion.div>

      {/* Featured Resource Header Card */}
      {resources.length > 0 && (
        <motion.div 
          onClick={() => {
            const access = getResourceAccess(plan, 0, 1);
            handleCardClick(resources[0], access.isLocked);
          }}
          variants={cardVariants} 
          className="bg-surface border border-outline rounded-[24px] p-6 md:p-8 mb-10 flex flex-col md:flex-row gap-8 items-center relative overflow-hidden group cursor-pointer hover:border-indigo-500/40 transition-all shadow-xl"
        >
          {/* Glassmorphic Glow background element */}
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/20 transition-all" />

          {/* Featured Visual Thumbnail */}
          <div className="w-full md:w-56 h-36 rounded-[16px] bg-indigo-950/40 border border-indigo-500/20 flex flex-col items-center justify-center flex-shrink-0 relative overflow-hidden group-hover:scale-[1.02] transition-transform">
            <BookOpen className="w-10 h-10 text-indigo-400 mb-2 relative z-10" strokeWidth={1.5} />
            <span className="text-[10px] font-mono text-indigo-300 font-bold tracking-wider z-10">РЕКОМЕНДУЕМОЕ ЧТЕНИЕ</span>
          </div>

          <div className="flex-1 min-w-0 z-10">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[9px] font-mono font-bold text-inverse-on-surface bg-on-surface rounded-[4px] px-2.5 py-0.5 inline-block uppercase tracking-tight">
                {t('resources.featured')}
              </span>
              <span className="text-[9px] font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded font-bold">
                {resources[0].tags[0]}
              </span>
            </div>

            <h2 className="text-xl md:text-2xl font-bold text-on-surface mb-2 group-hover:text-indigo-300 transition-colors font-clash truncate">
              {resources[0].title}
            </h2>
            <p className="text-xs text-on-surface-variant leading-relaxed mb-6 max-w-2xl line-clamp-2">
              {resources[0].desc}
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <button className="bg-on-surface hover:bg-white text-inverse-on-surface rounded-[12px] px-5 py-2.5 text-xs font-bold transition-colors flex items-center gap-2 self-start font-sans">
                <BookOpen className="w-4 h-4" strokeWidth={1.5} /> {t('resources.readNow')}
              </button>
              <div className="flex gap-4 text-[10px] font-mono text-on-surface-variant">
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-indigo-400" strokeWidth={1.5} /> 5 мин чтения</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Catalog Layout */}
      {resources.length === 0 ? (
        <div className="py-20 text-center bg-surface border border-outline rounded-[16px] text-on-surface-variant font-sans">
          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" strokeWidth={1.5} />
          <p className="text-sm font-semibold">Нет доступных ресурсов</p>
          <p className="text-xs text-on-surface-variant/60 mt-1">Создайте хотя бы один курс, чтобы сформировать ИИ-библиотеку ресурсов.</p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8 w-full min-w-0">
          {/* Left Column Filters */}
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

          {/* Right Column Catalog Content */}
          <div className="flex-1 space-y-6 min-w-0 w-full">
            {/* Search + Tabs Bar */}
            <div className="space-y-4">
              <div className="relative border border-outline rounded-xl bg-surface focus-within:border-white focus-within:bg-surface-container-high transition-all py-3 px-4 shadow-sm flex items-center gap-3">
                <Search className="w-4 h-4 text-on-surface-variant" strokeWidth={1.5} />
                <input
                  type="text"
                  placeholder="Поиск по адаптивным ресурсам..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none"
                />
              </div>

              {/* Tabs */}
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
                    
                    // Central access check
                    const access = getResourceAccess(plan, resource.typeIdx, seenCourseIds[cId]);

                    return (
                      <ResourceCard 
                        key={resource.id} 
                        resource={resource} 
                        isLocked={access.isLocked}
                        userPlan={plan}
                        onClick={() => handleCardClick(resource, access.isLocked)}
                      />
                    );
                  });
                })()}
              </AnimatePresence>
              
              {activeTab === 'All' && filteredResources.length > visibleCount && (
                <div className="col-span-full flex justify-center mt-2 mb-4">
                  <button 
                    onClick={() => setVisibleCount(prev => prev + 9)}
                    className="bg-surface-container-high hover:bg-[#3C3C3E] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-colors border border-outline shadow-sm"
                  >
                    Показать остальные материалы
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

      {/* Dynamic AI Resource Modal for Projects, Cheatsheets, Articles */}
      <AnimatePresence>
        {activeResource && (
          <ResourceModal 
            resource={activeResource} 
            userProfile={userProfile}
            onClose={() => setActiveResource(null)} 
          />
        )}
      </AnimatePresence>

      {/* External Curated Recommendations Modal for Videos and Repositories */}
      <AnimatePresence>
        {externalModalData && (
          <ExternalResourceModal 
            resource={externalModalData.resource}
            externalData={externalModalData.externalData}
            loading={externalModalData.loading}
            userPlan={plan}
            onClose={() => setExternalModalData(null)}
            onRefreshAlternative={async () => {
              setExternalModalData(prev => ({ ...prev, loading: true }));
              const ext = await fetchCuratedExternalResources({
                topicLabel: externalModalData.resource.title,
                courseTitle: externalModalData.resource.tags[0],
                lessonContent: externalModalData.resource.rawNode?.content,
                resourceType: externalModalData.resource.type,
                userPlan: plan
              });
              setExternalModalData(prev => ({ ...prev, externalData: ext, loading: false }));
            }}
          />
        )}
      </AnimatePresence>
    </motion.main>
  );
}
