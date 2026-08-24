export const calculateMastery = (lastScore, lastAttemptTimestamp, total = null) => {
  if (lastScore === null || lastScore === undefined) return 0;
  if (!lastAttemptTimestamp) return 0;
  
  // Handle Firestore Timestamp or Date object or string
  let lastDate;
  if (lastAttemptTimestamp.toDate) {
    lastDate = lastAttemptTimestamp.toDate();
  } else {
    lastDate = new Date(lastAttemptTimestamp);
  }
  
  if (isNaN(lastDate.getTime())) return 0;

  // Backward compatibility: normalize raw question count (e.g. 4 out of 4) to 0-100%
  let normalizedScore = Number(lastScore);
  if (total && total > 0 && normalizedScore <= total && normalizedScore < 20) {
    normalizedScore = Math.round((normalizedScore / total) * 100);
  } else if (normalizedScore <= 10 && normalizedScore > 0) {
    normalizedScore = Math.min(100, Math.round(normalizedScore * 25));
  }

  const daysSince = (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
  const decayRate = 0.05; // 5% decay per day
  const decayed = normalizedScore * Math.pow(1 - decayRate, Math.max(0, daysSince));
  
  return Math.max(0, Math.min(100, Math.round(decayed)));
};

export const getMasteryColor = (masteryScore) => {
  if (masteryScore >= 80) return '#10b981'; // Emerald/Green
  if (masteryScore >= 50) return '#f59e0b'; // Amber/Yellow
  return '#ef4444'; // Red
};
