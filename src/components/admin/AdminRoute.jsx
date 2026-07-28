import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { auth, db } from '../../firebase.js';
import { doc, getDoc } from 'firebase/firestore';

export default function AdminRoute() {
  const [isAdmin, setIsAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!auth.currentUser) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      
      try {
        // Проверяем кастомный claim (тот, что ставится через Cloud Functions)
        const token = await auth.currentUser.getIdTokenResult(true);
        let hasAdminAccess = token.claims.admin === true;

        // Если claim'а нет, проверяем документ пользователя в Firestore (для удобства разработки)
        if (!hasAdminAccess) {
          const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.role === 'admin' || data.isAdmin === true) {
              hasAdminAccess = true;
            }
          }
        }

        setIsAdmin(hasAdminAccess);
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0A0A0B] w-full">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return isAdmin ? <Outlet /> : <Navigate to="/dashboard" replace />;
}
