import React from 'react';

// --- UI COMPONENTS ---
export const ClayButton = ({ onClick, children, className = '', disabled = false, colorClass = "bg-indigo-500 text-white border-b-4 border-indigo-700 hover:bg-indigo-400" }) => {
  const baseClasses = "font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  
  return (
    <button onClick={onClick} className={`${baseClasses} ${colorClass} ${className}`} disabled={disabled}>
      {children}
    </button>
  );
};