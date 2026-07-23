import { useState, useEffect, useCallback } from 'react';
import { collection, doc, getDoc, setDoc, deleteDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase.js';
import { ACHIEVEMENTS } from '../constants/achievements.js';
import { useGamification } from '../context/GamificationContext.jsx';
import { useXP } from './useXP.js';
import { onAuthStateChanged } from 'firebase/auth';
import { getUserCourses } from '../services/courseService.js';

export const useAchievements = () => {
  const [unlockedAchievements, setUnlockedAchievements] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const { showAchievementToast } = useGamification();
  const { addXP } = useXP();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsLoading(true);
        try {
          // 1. Fetch user's unlocked achievements from Firestore
          const achRef = collection(db, 'users', user.uid, 'achievements');
          const snap = await getDocs(achRef);
          const unlocked = {};
          snap.forEach(doc => {
            unlocked[doc.id] = doc.data();
          });
          setUnlockedAchievements(unlocked);

          // 2. Fetch user details (XP, Level, Streak)
          const userSnap = await getDoc(doc(db, 'users', user.uid));
          const userData = userSnap.exists() ? userSnap.data() : {};
          const xp = userData.xp || 0;
          const level = userData.level || 1;
          const streak = userData.streakDays || 0;

          // 3. Fetch user's courses to count generated roadmaps and completed lessons
          const userCourses = await getUserCourses(user.uid);
          const roadmapsCount = userCourses.length;
          const completedLessonsCount = userCourses.reduce((acc, c) => acc + (c.nodes || []).filter(n => n.status === 'completed').length, 0);

          // --- Run database migration from legacy root collection to users subcollection ---
          for (const course of userCourses) {
            for (const node of (course.nodes || [])) {
              const legacyRef = doc(db, 'quizResults', `${user.uid}_${node.id}`);
              try {
                const legacySnap = await getDoc(legacyRef);
                if (legacySnap.exists()) {
                  const legacyData = legacySnap.data();
                  const newRef = doc(db, 'users', user.uid, 'quizResults', node.id);
                  const newSnap = await getDoc(newRef);
                  
                  if (!newSnap.exists()) {
                    const attempts = [{
                      score: legacyData.score || 0,
                      date: legacyData.lastAttemptAt?.toDate?.()?.toISOString() || legacyData.lastAttemptAt || new Date().toISOString()
                    }];
                    
                    await setDoc(newRef, {
                      userId: user.uid,
                      roadmapId: legacyData.roadmapId || course.id,
                      nodeId: node.id,
                      score: legacyData.score || 0,
                      passed: legacyData.passed || false,
                      attempts,
                      attemptsCount: 1,
                      lastAttemptAt: legacyData.lastAttemptAt || serverTimestamp(),
                      cooldownUntil: legacyData.cooldownUntil || null
                    });
                    console.log(`Successfully migrated quiz results for node: ${node.id}`);
                  }
                  
                  // Delete legacy doc to prevent re-migration
                  await deleteDoc(legacyRef);
                  console.log(`Deleted legacy quiz results for node: ${node.id}`);
                }
              } catch (migErr) {
                console.error(`Migration error for node ${node.id}:`, migErr);
              }
            }
          }

          // 4. Fetch quiz results (now includes migrated results!)
          const quizSnap = await getDocs(collection(db, 'users', user.uid, 'quizResults'));
          const quizResults = [];
          quizSnap.forEach(d => quizResults.push(d.data()));
          const quizzesCount = quizResults.length;
          const perfectQuizzesCount = quizResults.filter(q => q.score === 100).length;

          // Helper function to check and unlock achievements locally and in Firestore
          const checkAndUnlock = async (id, condition) => {
            if (condition && !unlocked[id]) {
              const docRef = doc(db, 'users', user.uid, 'achievements', id);
              await setDoc(docRef, { unlockedAt: serverTimestamp() });
              
              unlocked[id] = { unlockedAt: new Date() };
              setUnlockedAchievements(prev => ({ ...prev, [id]: { unlockedAt: new Date() } }));
              
              const def = ACHIEVEMENTS.find(a => a.id === id);
              if (def) {
                showAchievementToast(def);
                setTimeout(() => {
                  addXP(def.xpReward, `Достижение: ${def.title}`);
                }, 1000);
              }
            }
          };

          // --- Automated Milestone Unlocking Rules ---
          // 👋 First Step (always unlocks for logged in user)
          await checkAndUnlock('first_step', true);

          // 🗺️ Explorer (First Roadmap) & Course Creator
          await checkAndUnlock('explorer_first', roadmapsCount >= 1);
          await checkAndUnlock('course_creator', roadmapsCount >= 1);
          
          // 🌱 Path Builder, Architect, Explorer Pro
          await checkAndUnlock('path_builder', roadmapsCount >= 5);
          await checkAndUnlock('architect', roadmapsCount >= 20);
          await checkAndUnlock('explorer_10', roadmapsCount >= 10);
          
          // 📚 First Lesson, Student, Learner, Scholar, Master Student
          await checkAndUnlock('first_lesson', completedLessonsCount >= 1);
          await checkAndUnlock('student_5', completedLessonsCount >= 5);
          await checkAndUnlock('learner_25', completedLessonsCount >= 25);
          await checkAndUnlock('scholar_100', completedLessonsCount >= 100);
          await checkAndUnlock('master_student', completedLessonsCount >= 250);
          
          // ✅ First Quiz, Quiz Rookie, Exam Solver, Quiz Champion
          await checkAndUnlock('first_quiz', quizzesCount >= 1);
          await checkAndUnlock('quiz_rookie', quizzesCount >= 5);
          await checkAndUnlock('exam_solver', quizzesCount >= 25);
          await checkAndUnlock('quiz_champion', quizzesCount >= 100);
          
          // 💯 Perfect Score, Perfectionist
          await checkAndUnlock('perfect_score_first', perfectQuizzesCount >= 1);
          await checkAndUnlock('perfectionist_10', perfectQuizzesCount >= 10);
          
          // ⭐ XP milestones
          await checkAndUnlock('xp_100', xp >= 100);
          await checkAndUnlock('xp_500', xp >= 500);
          await checkAndUnlock('xp_1000', xp >= 1000);
          await checkAndUnlock('xp_5000', xp >= 5000);
          await checkAndUnlock('xp_10000', xp >= 10000);
          await checkAndUnlock('xp_50000', xp >= 50000);
          
          // 🏅 Level milestones
          await checkAndUnlock('level_5_ach', level >= 5);
          await checkAndUnlock('level_10', level >= 10);
          await checkAndUnlock('level_25', level >= 25);
          await checkAndUnlock('level_50', level >= 50);
          
          // 🔥 Streak milestones
          await checkAndUnlock('streak_3', streak >= 3);
          await checkAndUnlock('streak_7_ach', streak >= 7);
          await checkAndUnlock('streak_14', streak >= 14);
          await checkAndUnlock('streak_30', streak >= 30);
          await checkAndUnlock('streak_100', streak >= 100);
          await checkAndUnlock('streak_365', streak >= 365);
          
        } catch (err) {
          console.error("Error auto-checking achievements:", err);
        } finally {
          setIsLoading(false);
        }
      } else {
        setUnlockedAchievements({});
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, [showAchievementToast, addXP]);

  const unlockAchievement = useCallback(async (achievementId) => {
    if (!auth.currentUser) return;
    if (unlockedAchievements[achievementId]) return;

    const achievementDef = ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!achievementDef) return;

    try {
      const docRef = doc(db, 'users', auth.currentUser.uid, 'achievements', achievementId);
      await setDoc(docRef, { unlockedAt: serverTimestamp() });
      
      setUnlockedAchievements(prev => ({ ...prev, [achievementId]: { unlockedAt: new Date() } }));
      
      showAchievementToast(achievementDef);
      setTimeout(() => {
        addXP(achievementDef.xpReward, `Достижение: ${achievementDef.title}`);
      }, 1000);
      
    } catch (e) {
      console.error("Failed to unlock achievement:", e);
    }
  }, [unlockedAchievements, showAchievementToast, addXP]);

  return { unlockedAchievements, unlockAchievement, isLoading };
};
