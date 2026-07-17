export const calculateMastery = (lastScore, lastAttemptTimestamp) => {
  if (!lastAttemptTimestamp) return 0;
  
  // Handle Firestore Timestamp or Date object or string
  let lastDate;
  if (lastAttemptTimestamp.toDate) {
    lastDate = lastAttemptTimestamp.toDate();
  } else {
    lastDate = new Date(lastAttemptTimestamp);
  }
  
  if (isNaN(lastDate.getTime())) return 0;

  const daysSince = (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
  const decayRate = 0.05; // 5% decay per day
  const decayed = lastScore * Math.pow(1 - decayRate, daysSince);
  
  return Math.max(0, Math.round(decayed));
};

export const getMasteryColor = (masteryScore) => {
  if (masteryScore >= 80) return '#10b981'; // Emerald/Green
  if (masteryScore >= 50) return '#f59e0b'; // Amber/Yellow
  return '#ef4444'; // Red
};
