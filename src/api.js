export const API_BASE_URL = 'http://localhost:5000/api';

export const fetcher = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error('An error occurred while fetching data.');
    const data = await res.json().catch(() => ({}));
    error.info = data.error || data;
    error.status = res.status;
    throw error;
  }
  return res.json();
};

export const syncUserWithBackend = async (uid, email, displayName) => {
  const res = await fetch(`${API_BASE_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: uid, email, name: displayName })
  });
  if (!res.ok) throw new Error('Failed to sync user');
  return res.json();
};

export const updateNodeProgressOnBackend = async (nodeId, userId, progress, completed) => {
  const res = await fetch(`${API_BASE_URL}/progress/${nodeId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, progress, completed })
  });
  if (!res.ok) throw new Error('Failed to update node progress');
  return res.json();
};

export const toggleBookmarkOnBackend = async (resourceId, userId) => {
  const res = await fetch(`${API_BASE_URL}/resources/${resourceId}/bookmark`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
  });
  if (!res.ok) throw new Error('Failed to toggle resource bookmark');
  return res.json();
};

export const resetUserProgressOnBackend = async (userId) => {
  const res = await fetch(`${API_BASE_URL}/users/${userId}/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to reset progress');
  return res.json();
};

export const updateUserProfileOnBackend = async (userId, data) => {
  const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update profile');
  return res.json();
};

export const fetchCourseContent = async (nodeId, userId, lang = 'ru') => {
  const res = await fetch(`${API_BASE_URL}/nodes/${nodeId}/content?userId=${userId}&lang=${lang}`);
  if (!res.ok) throw new Error('Failed to fetch course content');
  return res.json();
};

export const completeLessonOnBackend = async (nodeId, lessonId, userId, lang = 'ru') => {
  const res = await fetch(`${API_BASE_URL}/nodes/${nodeId}/lessons/${lessonId}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, lang })
  });
  if (!res.ok) throw new Error('Failed to complete lesson');
  return res.json();
};

