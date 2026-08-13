import { useState, useEffect } from 'react';
import { db, auth } from '../firebase.js';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export function useUserGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!auth.currentUser) {
      setGroups([]);
      setLoading(false);
      return;
    }

    const userId = auth.currentUser.uid;
    const groupsRef = collection(db, 'groups');
    const q = query(groupsRef, where('invitedUserIds', 'array-contains', userId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedGroups = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGroups(fetchedGroups);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching user groups:", err);
      setError(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth.currentUser]);

  return { groups, loading, error };
}
