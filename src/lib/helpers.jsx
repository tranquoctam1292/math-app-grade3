// src/lib/helpers.jsx
import React from 'react';

// Một component Button đơn giản với style giống đất sét (claymorphism)
export const ClayButton = ({ onClick, children, className = '', disabled = false }) => {
  const baseClasses = "font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  const colorClasses = "bg-indigo-500 text-white border-b-4 border-indigo-700 hover:bg-indigo-400";
  
  return (
    <button onClick={onClick} className={`${baseClasses} ${colorClasses} ${className}`} disabled={disabled}>
      {children}
    </button>
  );
};