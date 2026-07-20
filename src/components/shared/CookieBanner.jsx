import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, ShieldAlert } from 'lucide-react';
import { useLocale } from '../../i18n.js';
import LegalDocModal from './LegalDocModal.jsx';

export default function CookieBanner() {
  const locale = useLocale();
  const [isVisible, setIsVisible] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'privacy' | 'cookie' | null

  useEffect(() => {
    const consent = localStorage.getItem('yourway-cookie-consent');
    if (!consent) {
      // Delay showing the banner slightly for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('yourway-cookie-consent', 'all');
    setIsVisible(false);
  };

  const handleAcceptEssential = () => {
    localStorage.setItem('yourway-cookie-consent', 'essential');
    setIsVisible(false);
  };

  if (!isVisible) {
    return (
      <AnimatePresence>
        {activeModal && (
          <LegalDocModal 
            isOpen={!!activeModal} 
            onClose={() => setActiveModal(null)} 
            docKey={activeModal} 
          />
        )}
      </AnimatePresence>
    );
  }

  const isRu = locale === 'ru';

  return (
    <>
      <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:max-w-md z-[200]">
        <motion.div
          initial={{ y: 50, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 30, opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 20, stiffness: 150 }}
          className="bg-[#1C1C1E]/95 backdrop-blur-md border border-[rgba(255,255,255,0.08)] rounded-[20px] p-5 md:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col gap-4 text-[#F5F5F7]"
        >
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-[rgba(255,255,255,0.04)]">
              <Cookie className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-bold text-sm tracking-tight text-white">
              {isRu ? 'Файлы Cookie & Конфиденциальность' : 'Cookies & Privacy Preferences'}
            </h3>
          </div>

          {/* Description */}
          <p className="text-xs text-[#98989D] leading-relaxed">
            {isRu ? (
              <>
                Мы используем файлы cookie для обеспечения базовой работы платформы YourWay.co, авторизации в личном кабинете и анализа работы сервиса. Оставаясь на сайте или нажимая "Принять все", вы соглашаетесь с нашей{' '}
                <button 
                  onClick={() => setActiveModal('privacy')}
                  className="text-white underline font-semibold hover:text-[#FFFFFF]/80"
                >
                  Политикой конфиденциальности
                </button>{' '}
                и{' '}
                <button 
                  onClick={() => setActiveModal('cookie')}
                  className="text-white underline font-semibold hover:text-[#FFFFFF]/80"
                >
                  Политикой Cookie
                </button>
                .
              </>
            ) : (
              <>
                We use cookies to ensure the basic operation of the YourWay.co platform, authorization in your account, and analyze the service. By staying on the site or clicking "Accept All", you agree to our{' '}
                <button 
                  onClick={() => setActiveModal('privacy')}
                  className="text-white underline font-semibold hover:text-[#FFFFFF]/80"
                >
                  Privacy Policy
                </button>{' '}
                and{' '}
                <button 
                  onClick={() => setActiveModal('cookie')}
                  className="text-white underline font-semibold hover:text-[#FFFFFF]/80"
                >
                  Cookie Policy
                </button>
                .
              </>
            )}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-1 flex-wrap sm:flex-nowrap">
            <button
              onClick={handleAcceptEssential}
              className="flex-1 min-w-[120px] border border-[rgba(255,255,255,0.08)] bg-[#2C2C2E]/40 hover:bg-[#FFFFFF]/10 text-white rounded-xl py-2 px-3 text-xs font-bold transition-colors"
            >
              {isRu ? 'Только необходимые' : 'Only Essential'}
            </button>
            <button
              onClick={handleAcceptAll}
              className="flex-1 min-w-[120px] bg-white hover:bg-[#E8E8ED] text-black rounded-xl py-2 px-3 text-xs font-bold transition-colors"
            >
              {isRu ? 'Принять все' : 'Accept All'}
            </button>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {activeModal && (
          <LegalDocModal 
            isOpen={!!activeModal} 
            onClose={() => setActiveModal(null)} 
            docKey={activeModal} 
          />
        )}
      </AnimatePresence>
    </>
  );
}
