import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, PlayCircle, FileCode2, GitBranch, BookOpen, Clock, User, Bookmark, BookmarkCheck } from 'lucide-react';

const RESOURCE_TYPES = {
  article:    { icon: FileText,   color: 'bg-primary',   label: 'Article' },
  video:      { icon: PlayCircle, color: 'bg-error',     label: 'Video' },
  cheatsheet: { icon: FileCode2,  color: 'bg-tertiary',  label: 'Cheat Sheet' },
  repository: { icon: GitBranch,  color: 'bg-secondary', label: 'Repository' },
};

const RESOURCES = [
  { id: 1, type: 'article', title: 'Understanding Attention Mechanisms', desc: 'Deep dive into self-attention and how it powers modern NLP architectures.', tags: ['NLP', 'Transformers'], author: 'Dr. Sarah Chen', meta: '12 min read', date: 'Jun 2, 2026' },
  { id: 2, type: 'video', title: 'Building Your First Neural Network', desc: 'Step-by-step tutorial walking you through creating a neural network from scratch.', tags: ['Tutorial', 'PyTorch'], author: 'AI Academy', meta: '45 min', date: 'May 28, 2026' },
  { id: 3, type: 'cheatsheet', title: 'Python for ML Quick Reference', desc: 'Essential Python snippets and patterns every ML practitioner should know.', tags: ['Python', 'Basics'], author: 'Prof. James Liu', meta: '', date: 'May 15, 2026' },
  { id: 4, type: 'repository', title: 'Transformer Implementation from Scratch', desc: 'Full PyTorch implementation of the original Transformer architecture.', tags: ['GitHub', 'Code'], author: '', meta: '2.4k stars', date: 'Apr 30, 2026' },
  { id: 5, type: 'article', title: 'The Future of Generative AI', desc: 'Industry trends and predictions shaping the next wave of generative models.', tags: ['GenAI', 'Trends'], author: 'Dr. Nina Patel', meta: '8 min read', date: 'May 20, 2026' },
  { id: 6, type: 'video', title: 'Deploying ML Models at Scale', desc: 'Production best practices for serving machine learning models reliably.', tags: ['MLOps', 'Cloud'], author: 'Dr. Rachel Green', meta: '1h 20min', date: 'May 10, 2026' },
  { id: 7, type: 'cheatsheet', title: 'Linear Algebra for Deep Learning', desc: 'Key formulas and concepts distilled into a single quick-reference sheet.', tags: ['Math', 'Foundations'], author: 'Prof. David Kim', meta: '', date: 'Apr 22, 2026' },
  { id: 8, type: 'article', title: "Ethical AI: A Practitioner's Guide", desc: 'Responsible AI development practices every team should adopt.', tags: ['Ethics', 'Policy'], author: 'Prof. David Kim', meta: '15 min read', date: 'Apr 18, 2026' },
  { id: 9, type: 'repository', title: 'Computer Vision Toolkit', desc: 'Pre-built CV components for rapid prototyping and experimentation.', tags: ['GitHub', 'Vision'], author: '', meta: '1.8k stars', date: 'Apr 5, 2026' },
];

const TABS = ['All', 'Articles', 'Videos', 'Cheat Sheets', 'Repositories'];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
};

function ResourceCard({ resource }) {
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
      whileHover={{ y: -5, scale: 1.02 }}
      className="bg-surface rounded-2xl border border-outline-variant overflow-hidden shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 flex flex-col group cursor-pointer"
    >
      <div className={`${typeInfo.color} h-1.5 w-full`}></div>
      <div className="p-6 flex flex-col h-full">
        <div className="flex items-center gap-2 text-on-surface-variant mb-4">
          <Icon className="w-5 h-5" />
          <span className="text-xs uppercase tracking-wider font-bold">{typeInfo.label}</span>
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

export default function Resources() {
  const [activeTab, setActiveTab] = useState('All');

  const filteredResources = RESOURCES.filter(r => {
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
        <h1 className="text-4xl font-bold text-on-surface mb-3 tracking-tight">Learning Resources</h1>
        <p className="text-lg text-on-surface-variant max-w-2xl">Curated articles, tutorials, repositories, and cheat sheets to accelerate your AI mastery.</p>
      </motion.div>

      {/* Featured Resource */}
      <motion.div variants={cardVariants} className="bg-surface rounded-3xl border border-outline-variant p-6 md:p-10 mb-10 shadow-lg relative overflow-hidden group cursor-pointer hover:border-primary/30 transition-colors">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[100px] rounded-full pointer-events-none group-hover:bg-primary/10 transition-colors duration-500"></div>
        <div className="flex flex-col md:flex-row gap-8 items-center relative z-10">
          <div className="w-full md:w-64 h-48 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center flex-shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-500">
            <BookOpen className="w-20 h-20 text-white/80" />
          </div>
          <div className="flex-1">
            <span className="text-xs font-bold text-primary bg-primary/10 rounded-full px-3 py-1 inline-block mb-3 uppercase tracking-wider">Featured Core Reading</span>
            <h2 className="text-3xl font-bold text-on-surface mb-3 group-hover:text-primary transition-colors">The Complete Guide to Transformer Architecture</h2>
            <p className="text-on-surface-variant leading-relaxed mb-6 max-w-2xl">
              An in-depth walkthrough of the Transformer model — from positional encoding and multi-head attention to layer normalization and feed-forward networks. Perfect for anyone looking to truly understand the architecture behind GPT, BERT, and beyond.
            </p>
            <div className="flex items-center gap-6">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-primary text-on-primary rounded-xl px-6 py-3 font-bold shadow-lg shadow-primary/20 flex items-center gap-2">
                <BookOpen className="w-5 h-5" /> Read Now
              </motion.button>
              <div className="flex gap-4 text-sm font-medium text-on-surface-variant">
                <span className="flex items-center gap-1.5"><User className="w-4 h-4" /> Dr. Sarah Chen</span>
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> 25 min read</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={cardVariants} className="flex gap-2 mb-8 bg-surface-container rounded-xl p-1.5 overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative px-6 py-3 rounded-lg text-sm font-bold whitespace-nowrap transition-colors z-10 flex-1 ${
              activeTab === tab ? 'text-on-surface' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {activeTab === tab && (
              <motion.div 
                layoutId="resources-tab-pill"
                className="absolute inset-0 bg-surface rounded-lg z-[-1] shadow-sm"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            {tab}
          </button>
        ))}
      </motion.div>

      {/* Grid */}
      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
        <AnimatePresence mode="popLayout">
          {filteredResources.map(resource => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </AnimatePresence>
      </motion.div>

    </motion.main>
  );
}
