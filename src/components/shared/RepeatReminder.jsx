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
        const q = query(collection(db, 'quizResults'), where('userId', '==', user.uid));
        const snap = await getDocs(q);
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
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between shadow-lg mb-6">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-amber-500" />
        </div>
        <div>
          <h3 className="font-bold text-on-surface">Время повторения!</h3>
          <p className="text-sm text-on-surface-variant">
            {nodesToRepeat} {nodesToRepeat === 1 ? 'урок требует' : 'уроков требуют'} повторения, так как уровень владения снизился.
          </p>
        </div>
      </div>
      <button 
        onClick={() => navigate('/graph')}
        className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md shadow-amber-500/20"
      >
        Перейти к графу
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
