import React from 'react';

export default function GroupMemberAvatar({ member, isCurrent = false }) {
  if (!member) return null;

  const initial = (member.displayName || member.username || 'U').charAt(0).toUpperCase();

  return (
    <div 
      className="relative group/avatar inline-flex items-center"
      title={`${member.displayName || member.username} (${isCurrent ? 'Текущий урок' : 'Пройдено'})`}
    >
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-white text-[10px] shadow-md border-2 border-surface transition-transform duration-300 group-hover/avatar:scale-125 ${
          isCurrent ? 'ring-2 ring-primary ring-offset-1 animate-pulse' : ''
        }`}
        style={{ backgroundColor: member.avatarColor || '#3b82f6' }}
      >
        {initial}
      </div>

      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/avatar:flex flex-col items-center z-50 pointer-events-none">
        <div className="bg-surface-container-highest border border-outline-variant text-on-surface text-[10px] font-bold px-2 py-0.5 rounded shadow-lg whitespace-nowrap">
          {member.displayName || member.username}
        </div>
        <div className="w-1.5 h-1.5 bg-surface-container-highest rotate-45 -mt-0.5 border-r border-b border-outline-variant" />
      </div>
    </div>
  );
}
