import React from 'react';

// --- UI COMPONENTS ---
export const ClayButton = ({ children, onClick, colorClass = "bg-white", className = "", disabled=false }) => (
    <button onClick={onClick} disabled={disabled} className={`relative overflow-hidden transition-all duration-150 ease-in-out rounded-2xl border-2 border-transparent ${disabled ? 'opacity-50 grayscale cursor-not-allowed' : 'active:scale-95 active:shadow-none shadow-[0_6px_0_rgba(0,0,0,0.15)] cursor-pointer'} ${colorClass} ${className}`}>
        {children}
        <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-white/30 to-transparent pointer-events-none"></div>
    </button>
);

export const Fraction = ({ num, den }) => (
  <span className="inline-block text-center align-middle mx-1.5" style={{ verticalAlign: 'middle' }}>
    <span className="block border-b-2 border-current px-1 text-lg font-bold leading-tight pb-[1px]">{num}</span>
    <span className="block px-1 text-lg font-bold leading-tight pt-[1px]">{den}</span>
  </span>
);

export const MathText = ({ text }) => {
  if (text === null || text === undefined) return "";
  const stringText = String(text);
  
  let cleanText = stringText
      .replace(/(\d+)\s+(\d{3})/g, '$1$2') 
      .replace(/(\d+),(\d{3})/g, '$1$2');

  let formattedText = cleanText.replace(/\d{4,}/g, (match) => {
      return match.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  });

  let processedText = formattedText
    .replace(/\t+imes/g, ' × ')      
    .replace(/\\t+imes/g, ' × ')     
    .replace(/\s+imes/g, ' × ')      
    .replace(/x\s*imes/g, ' × ')     
    .replace(/\\times/g, ' × ')      
    .replace(/\*/g, ' × ')            
    .replace(/\sx\s/g, ' × ')        
    .replace(/(\d)\s+x\s+(\d)/g, '$1 × $2') 
    .replace(/\\div/g, ':')          
    .replace(/:/g, ':')              
    .replace(/\f/g, '\\f') 
    .replace(/\\fracrac/g, '\\frac')
    .replace(/\\frac\\frac/g, '\\frac')
    .replace(/\$/g, '');

  const regex = /(\\frac\{([0-9.]+)\}\{([0-9.]+)\}|([0-9.]+)\/([0-9.]+))/g;
  const elements = [];
  let lastIndex = 0;
  
  processedText.replace(regex, (match, latexGroup, n1, d1, n2, d2, index) => {
    if (index > lastIndex) {
        elements.push(<span key={`text-${index}`}>{processedText.substring(lastIndex, index)}</span>);
    }
    elements.push(<Fraction key={`frac-${index}`} num={n1 || n2} den={d1 || d2} />);
    lastIndex = index + match.length;
    return match;
  });
  
  if (lastIndex < processedText.length) {
      elements.push(<span key={`text-end`}>{processedText.substring(lastIndex)}</span>);
  }
  
  return <span className="inline-block leading-relaxed whitespace-pre-wrap">{elements}</span>;
};
