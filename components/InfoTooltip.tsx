import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { createPortal } from 'react-dom';

interface InfoTooltipProps {
  content: React.ReactNode;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ content }) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const updatePosition = () => {
    if (triggerRef.current && isOpen) {
      const rect = triggerRef.current.getBoundingClientRect();
      // Position above the trigger, centered horizontally
      setPosition({
        top: rect.top - 10, // 10px spacing
        left: rect.left + (rect.width / 2)
      });
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('scroll', () => setIsOpen(false)); // Close on scroll to avoid drift
      window.addEventListener('resize', () => setIsOpen(false));
    }
    return () => {
      window.removeEventListener('scroll', () => setIsOpen(false));
      window.removeEventListener('resize', () => setIsOpen(false));
    }
  }, [isOpen]);

  return (
    <>
      <button
        ref={triggerRef}
        className="relative inline-flex items-center ml-2 text-ink-muted/50 hover:text-accent-gold transition-colors focus:outline-none"
        onMouseEnter={() => {
          setIsOpen(true);
          setTimeout(updatePosition, 0); // Next tick to ensure ref is ready
        }}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Info size={14} />
      </button>

      {isOpen && createPortal(
        <div
          className="fixed w-64 p-3 bg-white/95 backdrop-blur-sm rounded-xl shadow-float border border-ink-border z-[9999] animate-in zoom-in-95 duration-200 pointer-events-none"
          style={{
            top: position.top,
            left: position.left,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="text-xs text-ink-main leading-relaxed whitespace-pre-wrap font-sans">
            {content}
          </div>
          {/* Arrow */}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-b border-r border-gray-100 transform rotate-45"></div>
        </div>,
        document.body
      )}
    </>
  );
};