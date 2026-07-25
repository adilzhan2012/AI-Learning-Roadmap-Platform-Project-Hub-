import React, { useState, useEffect } from 'react';
import { db } from '../../firebase.js';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { Wrench, X, Clock, Play, Square, Loader2 } from 'lucide-react';

export default function MaintenanceModal({ onClose }) {
  const [maintenance, setMaintenance] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [durationValue, setDurationValue] = useState(30);
  const [durationType, setDurationType] = useState('minutes');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const docRef = doc(db, 'settings', 'maintenance');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setMaintenance(docSnap.data());
      } else {
        setMaintenance({ isActive: false, endTime: null });
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleStart = async () => {
    setIsSaving(true);
    try {
      // Calculate end time
      const multiplier = durationType === 'minutes' ? 60 * 1000 : 60 * 60 * 1000;
      const endTimeMs = Date.now() + (durationValue * multiplier);
      const endTimeDate = new Date(endTimeMs);

      await setDoc(doc(db, 'settings', 'maintenance'), {
        isActive: true,
        endTime: endTimeDate, // Firestore will convert this to Timestamp
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error starting maintenance", error);
      alert("Не удалось включить технические работы.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStop = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'maintenance'), {
        isActive: false,
        endTime: null,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error stopping maintenance", error);
      alert("Не удалось выключить технические работы.");
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate remaining time
  let remainingText = '';
  if (maintenance?.isActive && maintenance?.endTime) {
    // Handling both Firestore Timestamp objects and standard Dates for robustness
    const end = maintenance.endTime.toDate ? maintenance.endTime.toDate() : new Date(maintenance.endTime);
    const diff = end.getTime() - Date.now();
    if (diff > 0) {
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      remainingText = h > 0 ? `${h} ч ${m} мин` : `${m} мин`;
    } else {
      remainingText = 'Время вышло';
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#09090B] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col relative">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${maintenance?.isActive ? 'bg-amber-500/10 text-amber-500' : 'bg-white/5 text-zinc-400'}`}>
              <Wrench className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-white">Технические работы</h2>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : maintenance?.isActive ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4">
                <Wrench className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Режим активен</h3>
              <p className="text-zinc-400 mb-6">
                Публичный сайт закрыт для пользователей.<br />
                Осталось: <span className="font-mono text-amber-400">{remainingText}</span>
              </p>
              
              <button 
                onClick={handleStop}
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Square className="w-5 h-5" />}
                Завершить досрочно
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-zinc-400 mb-6">
                При включении сайт будет закрыт заглушкой. Выберите примерное время окончания работ, после которого сайт автоматически откроется.
              </p>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-300 mb-2">Длительность работ</label>
                <div className="flex gap-3">
                  <input 
                    type="number" 
                    min="1"
                    value={durationValue}
                    onChange={(e) => setDurationValue(Number(e.target.value))}
                    className="w-24 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-center font-mono"
                  />
                  <select 
                    value={durationType}
                    onChange={(e) => setDurationType(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 appearance-none"
                  >
                    <option value="minutes">Минут</option>
                    <option value="hours">Часов</option>
                  </select>
                </div>
              </div>

              <button 
                onClick={handleStart}
                disabled={isSaving || durationValue < 1}
                className="w-full flex items-center justify-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                Включить режим
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
