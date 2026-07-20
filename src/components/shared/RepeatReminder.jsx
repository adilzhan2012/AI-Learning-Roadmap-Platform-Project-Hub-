import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../../firebase.js';
import { calculateMastery } from '../../hooks/useMastery.js';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';

export default function RepeatReminder() {
  const [nodesToRepeat, setNodesToRepeat] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      try {
        const snap = await getDocs(collection(db, 'users', user.uid, 'quizResults'));
        const resultsMap = {};
        
        snap.forEach(doc => {
          const data = doc.data();
          if (!resultsMap[data.nodeId] || data.lastAttemptAt > resultsMap[data.nodeId].lastAttemptAt) {
            resultsMap[data.nodeId] = data;
          }
        });

        let toRepeat = 0;
        Object.values(resultsMap).forEach(res => {
          if (res.passed) {
            const mastery = calculateMastery(res.score, res.lastAttemptAt);
            if (mastery < 80) toRepeat++;
          }
        });

        setNodesToRepeat(toRepeat);
      } catch (e) {
        console.error("Failed to check repeat reminder:", e);
      }
    });
    return () => unsubscribe();
  }, []);

  if (nodesToRepeat === 0) return null;

  return (
    <div className="bg-[#1C1C1E] border border-[rgba(255,255,255,0.08)] rounded-[16px] p-5 flex items-center justify-between mb-6 font-sans">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-[#2C2C2E] border border-[rgba(255,255,255,0.08)] rounded-[12px] flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-[#FFFFFF]" strokeWidth={1.5} />
        </div>
        <div>
          <h3 className="font-bold text-[#F5F5F7]">Время повторения!</h3>
          <p className="text-sm text-[#98989D]">
            {nodesToRepeat} {nodesToRepeat === 1 ? 'урок требует' : 'уроков требуют'} повторения, так как уровень владения снизился.
          </p>
        </div>
      </div>
      <button 
        onClick={() => navigate('/graph')}
        className="bg-[#FFFFFF] hover:bg-[#E8E8ED] text-[#000000] px-5 py-2.5 rounded-[12px] font-bold flex items-center gap-2 transition-all text-sm"
      >
        Перейти к графу
        <ArrowRight className="w-4 h-4 text-[#000000]" strokeWidth={1.5} />
      </button>
    </div>
  );
}
