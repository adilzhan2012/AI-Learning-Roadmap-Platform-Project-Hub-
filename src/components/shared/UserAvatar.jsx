import React, { useState } from 'react';

export default function UserAvatar({
  photoURL,
  firstName,
  lastName,
  email,
  avatarColor,
  className = '',
  onClick,
  children
}) {
  const [imgError, setImgError] = useState(false);

  // Determine initials
  let userInitial = '?';
  if (firstName) {
    userInitial = firstName.charAt(0).toUpperCase();
    if (lastName) {
      userInitial += lastName.charAt(0).toUpperCase();
    }
  } else if (email) {
    userInitial = email.charAt(0).toUpperCase();
  }

  // Determine fallback color
  // default to indigo-purple gradient if no avatarColor provided
  const hasCustomColor = !!avatarColor;
  const isHexColor = hasCustomColor && avatarColor.startsWith('#');
  
  const defaultClasses = "bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold select-none shrink-0 overflow-hidden";
  
  let fallbackStyle = {};
  let fallbackClasses = `${defaultClasses} ${className}`;

  if (isHexColor) {
    fallbackStyle = { backgroundColor: avatarColor };
    // remove gradient classes if using custom hex color
    fallbackClasses = fallbackClasses.replace(/bg-gradient-to-br from-[a-z]+-\d+ to-[a-z]+-\d+/, '');
  } else if (hasCustomColor) {
    // it's a tailwind class like "bg-red-500"
    fallbackClasses = fallbackClasses.replace(/bg-gradient-to-br from-[a-z]+-\d+ to-[a-z]+-\d+/, avatarColor);
  }

  if (photoURL && !imgError) {
    return (
      <div 
        className={`relative rounded-full shrink-0 overflow-hidden flex items-center justify-center ${className}`} 
        onClick={onClick}
        style={{ cursor: onClick ? 'pointer' : 'default' }}
      >
        <img 
          src={photoURL} 
          alt="Avatar" 
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
        {children}
      </div>
    );
  }

  return (
    <div 
      className={`relative rounded-full ${fallbackClasses}`}
      style={{ ...fallbackStyle, cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      {userInitial}
      {children}
    </div>
  );
}
