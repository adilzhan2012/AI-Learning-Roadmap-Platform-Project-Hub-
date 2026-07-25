import React, { useEffect } from 'react';
import { ShieldBan, ArrowLeft } from 'lucide-react';
import { auth } from '../../firebase.js';
import { signOut } from 'firebase/auth';
import { motion } from 'framer-motion';

export default function BannedModal() {
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error(e);
    }
  };

  // Lock scrolling while the modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-500/10 blur-[100px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center max-w-lg w-full text-center bg-[#09090B] border border-rose-500/20 p-10 rounded-3xl shadow-2xl"
      >
        <div className="w-20 h-20 mb-6 bg-rose-500/10 rounded-full flex items-center justify-center border border-rose-500/20 shadow-[0_0_30px_rgba(244,63,94,0.2)]">
          <ShieldBan className="w-10 h-10 text-rose-500 animate-pulse" />
        </div>
        
        <h1 className="text-3xl font-bold text-white tracking-tight mb-4">
          Аккаунт заблокирован
        </h1>
        <p className="text-zinc-400 mb-8 leading-relaxed">
          Ваш доступ к платформе был приостановлен администратором за нарушение правил сервиса. 
          Если вы считаете, что это ошибка, обратитесь в службу поддержки.
        </p>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 px-8 py-3 rounded-xl transition-colors font-medium shadow-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          Выйти из аккаунта
        </button>
      </motion.div>
    </div>
  );
}
