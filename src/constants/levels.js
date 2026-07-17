export const LEVELS = [
  { level: 1, title: "Новичок",      xpRequired: 0 },
  { level: 2, title: "Ученик",       xpRequired: 100 },
  { level: 3, title: "Практик",      xpRequired: 300 },
  { level: 4, title: "Знаток",       xpRequired: 700 },
  { level: 5, title: "Эксперт",      xpRequired: 1500 },
  { level: 6, title: "Мастер",       xpRequired: 3000 },
  { level: 7, title: "Архитектор",   xpRequired: 6000 },
  { level: 8, title: "Легенда",      xpRequired: 12000 },
];

export const calculateLevel = (xp) => {
  let currentLevel = LEVELS[0];
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].xpRequired) {
      currentLevel = LEVELS[i];
    } else {
      break;
    }
  }
  
  const nextLevel = LEVELS.find(l => l.level === currentLevel.level + 1) || null;
  
  return {
    current: currentLevel,
    next: nextLevel,
    progress: nextLevel 
      ? Math.max(0, Math.min(100, ((xp - currentLevel.xpRequired) / (nextLevel.xpRequired - currentLevel.xpRequired)) * 100))
      : 100
  };
};
