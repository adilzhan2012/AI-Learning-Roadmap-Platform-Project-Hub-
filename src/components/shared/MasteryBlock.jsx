import React from 'react';

const MasteryBlock = ({ masteryScore }) => {
  if (masteryScore === null || masteryScore === undefined) return null;

  const getColor = (score) => {
    if (score >= 80) return { bar: 'bg-green-500', text: 'text-green-600 dark:text-green-400', label: 'Отлично' };
    if (score >= 50) return { bar: 'bg-yellow-400', text: 'text-yellow-600 dark:text-yellow-400', label: 'Повторить скоро ⚠' };
    return { bar: 'bg-red-500', text: 'text-red-600 dark:text-red-400', label: 'Нужно повторение 🔴' };
  };

  const colors = getColor(masteryScore);

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">Mastery score</p>
      <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-1.5">
        <div
          className={`h-1.5 rounded-full transition-all ${colors.bar}`}
          style={{ width: `${masteryScore}%` }}
        />
      </div>
      <div className="flex justify-between items-center">
        <span className={`text-xs font-medium ${colors.text}`}>{colors.label}</span>
        <span className="text-xs text-gray-400 font-medium">{masteryScore}%</span>
      </div>
    </div>
  );
};

export default MasteryBlock;
