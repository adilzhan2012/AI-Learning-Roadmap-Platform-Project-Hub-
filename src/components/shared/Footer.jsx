import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, MessageCircle, Map, LayoutDashboard, Compass, Trophy, Library, LineChart, ChevronRight } from 'lucide-react';
import { useLocale, t } from '../../i18n.js';
import Logo from './Logo.jsx';
import CompanyModal from './CompanyModal.jsx';
import FeaturesModal from './FeaturesModal.jsx';
import LegalDocModal from './LegalDocModal.jsx';

const NAV_ITEMS = [
  { id: 'dashboard', path: '/dashboard', label: 'nav.dashboard', icon: <LayoutDashboard className="w-5 h-5" />, desc: 'Ваш личный кабинет и статистика', descEn: 'Your personal dashboard and learning statistics' },
  { id: 'courses', path: '/courses', label: 'nav.courses', icon: <Compass className="w-5 h-5" />, desc: 'Каталог ИИ-курсов и дорожных карт', descEn: 'AI courses catalog and learning roadmaps' },
  { id: 'graph', path: '/graph', label: 'nav.graph', icon: <Map className="w-5 h-5" />, desc: 'Интерактивный граф ваших знаний', descEn: 'Interactive knowledge graph of your skills' },
  { id: 'achievements', path: '/achievements', label: 'nav.achievements', fallback: 'Достижения', icon: <Trophy className="w-5 h-5" />, desc: 'Ваши награды и глобальные лиги', descEn: 'Your badges, achievements and global leagues' },
  { id: 'resources', path: '/resources', label: 'nav.resources', icon: <Library className="w-5 h-5" />, desc: 'Полезные материалы и статьи', descEn: 'Curated articles, repositories and guides' },
  { id: 'insights', path: '/insights', label: 'nav.insights', icon: <LineChart className="w-5 h-5" />, desc: 'Аналитика и рекомендации', descEn: 'Learning analytics and smart recommendations' },
];

export default function Footer() {
  const locale = useLocale();
  const [hoveredNav, setHoveredNav] = useState(null);
  
  const [isCompanyModalOpen, setCompanyModalOpen] = useState(false);
  const [isFeaturesModalOpen, setFeaturesModalOpen] = useState(false);
  
  const [legalModalDoc, setLegalModalDoc] = useState(null);

  const renderNavPopup = (item) => (
    <AnimatePresence>
      {hoveredNav === item.id && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="absolute left-full ml-4 top-1/2 -translate-y-1/2 w-64 bg-surface/90 backdrop-blur-xl border border-outline/50 p-4 rounded-2xl shadow-2xl z-50 pointer-events-none hidden md:flex flex-col gap-2"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-xl shrink-0">
              {item.icon}
            </div>
            <span className="font-semibold text-on-surface">{t(item.label) || item.fallback}</span>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            {locale === 'ru' ? item.desc : (item.descEn || item.desc)}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <footer className="w-full bg-surface-container/30 border-t border-outline-variant/30 mt-20 relative z-10">
      <div className="max-w-7xl mx-auto px-6 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8">
          
          {/* Brand Column */}
          <div className="lg:col-span-2 flex flex-col items-start">
            <Link to="/about" className="flex items-center gap-3 mb-6 group cursor-pointer" title="О проекте / About yourway.co">
              <Logo className="w-10 h-10 transition-transform group-hover:scale-105" />
              <span className="text-2xl font-bold font-clash text-on-surface group-hover:text-primary transition-colors">yourway.co</span>
            </Link>
            <p className="text-on-surface-variant text-sm leading-relaxed max-w-xs">
              {locale === 'ru' 
                ? 'ИИ-платформа для создания персонализированных образовательных маршрутов. Учитесь эффективно, структурированно и с интересом.'
                : 'AI-powered platform for creating personalized learning roadmaps. Learn effectively, structurally, and with passion.'}
            </p>
          </div>

          {/* Navigation Column */}
          <div className="flex flex-col gap-4">
            <h4 className="text-sm font-bold tracking-wider text-on-surface uppercase mb-2">
              {locale === 'ru' ? 'Навигация' : 'Navigation'}
            </h4>
            <ul className="flex flex-col gap-3">
              {NAV_ITEMS.map(item => (
                <li key={item.id} className="relative flex items-center">
                  <Link
                    to={item.path}
                    className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 group"
                    onMouseEnter={() => setHoveredNav(item.id)}
                    onMouseLeave={() => setHoveredNav(null)}
                  >
                    <span>{t(item.label) || item.fallback}</span>
                    <ChevronRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </Link>
                  {renderNavPopup(item)}
                </li>
              ))}
            </ul>
          </div>

          {/* Company Column */}
          <div className="flex flex-col gap-4">
            <h4 className="text-sm font-bold tracking-wider text-on-surface uppercase mb-2">
              {locale === 'ru' ? 'Компания' : 'Company'}
            </h4>
            <ul className="flex flex-col gap-3">
              <li>
                <Link
                  to="/about"
                  className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 group"
                >
                  <span>{locale === 'ru' ? 'О проекте' : 'About Project'}</span>
                  <ChevronRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </Link>
              </li>
              <li>
                <button 
                  onClick={() => setCompanyModalOpen(true)}
                  className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors text-left flex items-center gap-1 group"
                >
                  <span>{locale === 'ru' ? 'О нас (Команда)' : 'About Us (Team)'}</span>
                  <ChevronRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </button>
              </li>
            </ul>
            <div className="mt-4 flex flex-col gap-2">
              <h5 className="text-sm font-bold tracking-wider text-on-surface uppercase mb-1">
                {locale === 'ru' ? 'Свяжитесь с нами' : 'Contact Us'}
              </h5>
              <a href="mailto:support@yourwayy.co" className="text-sm text-on-surface-variant hover:text-primary transition-colors flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/50"></span> support@yourwayy.co
              </a>
              <a href="mailto:info@yourwayy.co" className="text-sm text-on-surface-variant hover:text-primary transition-colors flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500/50"></span> info@yourwayy.co
              </a>
            </div>
          </div>

          {/* Product & Socials Column */}
          <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-4">
              <h4 className="text-sm font-bold tracking-wider text-on-surface uppercase mb-2">
                {locale === 'ru' ? 'Продукт' : 'Product'}
              </h4>
              <ul className="flex flex-col gap-3">
                <li>
                  <button 
                    onClick={() => setFeaturesModalOpen(true)}
                    className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors text-left flex items-center gap-1 group"
                  >
                    <span>{locale === 'ru' ? 'Возможности' : 'Features'}</span>
                    <ChevronRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </button>
                </li>
                <li>
                  <Link 
                    to="/pricing"
                    className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 group"
                  >
                    <span>{locale === 'ru' ? 'Тарифы' : 'Pricing'}</span>
                    <ChevronRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-4">
              <h4 className="text-sm font-bold tracking-wider text-on-surface uppercase">
                {locale === 'ru' ? 'Мы в соцсетях' : 'Socials'}
              </h4>
              <div className="flex items-center gap-6">
                <a href="https://www.instagram.com/yourwayy.co?igsh=MXhqZWl0ajYzeDRoeQ==" target="_blank" rel="noopener noreferrer" className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="24" height="24" viewBox="0 0 24 24" 
                    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  >
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                  </svg>
                </a>
                <a 
                  href="https://www.youtube.com/channel/UCK2tM6tjfYL0hUBlTv2MXIA" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-on-surface-variant hover:text-red-500 transition-colors flex items-center justify-center"
                  aria-label="YouTube"
                  title="YouTube"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
                <a 
                  href="https://www.tiktok.com/@yourway.co?_r=1&_t=ZS-996YOWZZFFU" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-on-surface-variant hover:text-[#FE2C55] transition-colors flex items-center justify-center"
                  aria-label="TikTok"
                  title="TikTok"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.01.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93v7.2c0 1.14-.38 2.29-1.07 3.16-.68.88-1.66 1.47-2.75 1.7-1.1.24-2.26.15-3.3-.3-1.03-.44-1.92-1.21-2.45-2.18-.54-.97-.73-2.14-.54-3.24.19-1.11.77-2.12 1.61-2.83.84-.71 1.93-1.07 3.03-1.03.35.01.7.07 1.05.15V14c-.21-.06-.43-.1-.65-.11-1.08-.06-2.18.35-2.91 1.18-.73.83-.98 2.01-.65 3.07.32 1.07 1.18 1.91 2.27 2.15 1.08.24 2.24-.04 3.03-.78.78-.73 1.22-1.8 1.22-2.88V.02h-1.99z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-outline-variant flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-on-surface-variant font-medium text-center md:text-left">
            &copy; {new Date().getFullYear()} yourway Inc. {locale === 'ru' ? 'Все права защищены.' : 'All rights reserved.'}
          </p>
          <p className="text-sm font-clash text-primary/90 font-medium text-center tracking-wide">
            Designed and Developed by Ivakin Daniil & Dutpayev Adilzhan
          </p>
          <div className="flex items-center gap-6 justify-center md:justify-end">
            <button 
              onClick={() => setLegalModalDoc('privacy')}
              className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors"
            >
              {locale === 'ru' ? 'Политика конфиденциальности' : 'Privacy Policy'}
            </button>
            <button 
              onClick={() => setLegalModalDoc('terms')}
              className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors"
            >
              {locale === 'ru' ? 'Условия' : 'Terms'}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isCompanyModalOpen && (
          <CompanyModal isOpen={true} onClose={() => setCompanyModalOpen(false)} />
        )}
        {isFeaturesModalOpen && (
          <FeaturesModal isOpen={true} onClose={() => setFeaturesModalOpen(false)} />
        )}
        {legalModalDoc && (
          <LegalDocModal isOpen={true} onClose={() => setLegalModalDoc(null)} docKey={legalModalDoc} />
        )}
      </AnimatePresence>
    </footer>
  );
}
