import React, { useState } from 'react';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  content: React.ReactNode;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ content }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
        className="relative inline-flex items-center ml-2"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
    >
      <button className="text-ink-muted/50 hover:text-accent-gold transition-colors focus:outline-none">
        <Info size={14} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-white/95 backdrop-blur-sm rounded-xl shadow-card border border-gray-100 z-50 animate-in zoom-in-95 duration-200">
            <div className="text-xs text-ink-main leading-relaxed whitespace-pre-wrap font-sans">
                {content}
            </div>
            {/* Arrow */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-b border-r border-gray-100 transform rotate-45"></div>
        </div>
      )}
    </div>
  );
};