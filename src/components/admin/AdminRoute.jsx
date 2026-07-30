import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { auth, db } from '../../firebase.js';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function AdminRoute() {
  const [isAdmin, setIsAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      
      try {
        let hasAdminAccess = false;
        
        try {
          const token = await user.getIdTokenResult(true);
          hasAdminAccess = token.claims.admin === true;
        } catch (tokenError) {
          console.warn("Failed to get fresh token, falling back to Firestore:", tokenError);
        }

        if (!hasAdminAccess) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.role === 'admin' || data.isAdmin === true) {
              hasAdminAccess = true;
            }
          }
        }

        setIsAdmin(hasAdminAccess);
      } catch (error) {
        console.error("Critical error checking admin status:", error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
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
