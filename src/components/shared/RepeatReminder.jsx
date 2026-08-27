import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
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
        const q = query(
          collection(db, 'users', user.uid, 'quizResults'),
          orderBy('lastAttemptAt', 'desc'),
          limit(50)
        );
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
        if (e.code !== 'permission-denied') {
          console.error("Failed to check repeat reminder:", e);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  if (nodesToRepeat === 0) return null;

  return (
    <div className="bg-surface border border-outline rounded-[16px] p-5 flex items-center justify-between mb-6 font-sans">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-surface-container border border-outline rounded-[12px] flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-on-surface" strokeWidth={1.5} />
        </div>
        <div>
          <h3 className="font-bold text-on-background">Время повторения!</h3>
          <p className="text-sm text-on-surface-variant">
            {nodesToRepeat} {nodesToRepeat === 1 ? 'урок требует' : 'уроков требуют'} повторения, так как уровень владения снизился.
          </p>
        </div>
      </div>
      <button 
        onClick={() => navigate('/graph')}
        className="bg-on-surface hover:bg-surface-container text-inverse-on-surface px-5 py-2.5 rounded-[12px] font-bold flex items-center gap-2 transition-all text-sm"
      >
        Перейти к графу
        <ArrowRight className="w-4 h-4 text-inverse-on-surface" strokeWidth={1.5} />
      </button>
    </div>
  );
}
