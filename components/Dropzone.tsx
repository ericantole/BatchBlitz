import React, { useCallback, useState, useRef } from 'react';
import { Upload, ImagePlus } from 'lucide-react';

interface DropzoneProps {
  onFilesDropped: (files: File[]) => void;
  compact?: boolean;
}

// Helper to safely access webkitRelativePath
const getFilePath = (file: File): string => {
  return (file as any).webkitRelativePath || '';
};



const PHRASES = ["Etsy Sellers", "Data Scientists", "Photo Studios", "Amazon KDP Creators", "Students & Educators", "Print-on-Demand Sellers", "ML/AI Trainers"];

const TypewriterBadge = () => {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [reverse, setReverse] = useState(false);
  const [blink, setBlink] = useState(true);

  // Blinking cursor effect
  React.useEffect(() => {
    const timeout2 = setInterval(() => {
      setBlink((prev) => !prev);
    }, 500);
    return () => clearInterval(timeout2);
  }, []);

  // Typing effect
  React.useEffect(() => {
    if (subIndex === PHRASES[index].length + 1 && !reverse) {
      const timeout = setTimeout(() => setReverse(true), 3000); // 3s wait before deleting
      return () => clearTimeout(timeout);
    }

    if (subIndex === 0 && reverse) {
      setReverse(false);
      setIndex((prev) => (prev + 1) % PHRASES.length);
      return;
    }

    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (reverse ? -1 : 1));
    }, reverse ? 50 : 100); // Typing speed vs deleting speed

    return () => clearTimeout(timeout);
  }, [subIndex, index, reverse]);

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-100 bg-white/50 backdrop-blur-sm shadow-sm mb-1">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
      <span className="text-[10px] md:text-xs font-medium text-ink-muted">
        #1 Private Batch Image Tool for{" "}
        <span className="text-ink-main font-bold">
          {PHRASES[index].substring(0, subIndex)}
        </span>
        <span className={`${blink ? "opacity-100" : "opacity-0"} text-accent-gold font-bold ml-px`}>|</span>
      </span>
    </div>
  );
};

export const Dropzone: React.FC<DropzoneProps> = ({ onFilesDropped, compact = false }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    // Recursive file extraction could be added here for drag-and-drop folders,
    // but standard File API often flattens drag events unless using FileSystemEntry API.
    // For now, we handle flat file drops and specific folder input selection.
    const droppedFiles = Array.from(e.dataTransfer.files).filter((file: File) =>
      file.type.startsWith('image/')
    );

    if (droppedFiles.length > 0) {
      onFilesDropped(droppedFiles);
    }
  }, [onFilesDropped]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).filter((file: File) =>
        file.type.startsWith('image/')
      );
      if (files.length > 0) onFilesDropped(files);
      e.target.value = ''; // Reset
    }
  };

  if (compact) {
    return (
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative group transition-all duration-300 overflow-hidden
          rounded-sm p-4 text-center cursor-pointer shadow-pressed backdrop-blur-sm
          ${isDragging
            ? 'bg-paper-dark/50'
            : 'bg-paper-dark/20 hover:bg-paper-dark/40'}
        `}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
          onChange={handleFileInput}
        />
        <div className="flex flex-col items-center justify-center gap-2 relative z-10">
          <Upload className={`w-5 h-5 transition-colors ${isDragging ? 'text-accent-gold' : 'text-ink-muted'}`} />
          <span className="text-xs font-medium text-ink-main uppercase tracking-wide">Add files</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center justify-center space-y-6 animate-in fade-in zoom-in duration-500">

      {/* Hero Text */}
      <div className="text-center space-y-2">

        <TypewriterBadge />

        <h1 className="text-6xl md:text-8xl font-serif font-bold text-ink-main drop-shadow-sm tracking-tighter">
          BatchBlitz
        </h1>
        <p className="text-lg md:text-xl text-ink-muted font-light max-w-2xl mx-auto text-center font-serif italic">
          The private studio for batch photo editing. <br className="md:hidden" />
          <span className="relative inline-block ml-0 md:ml-2">
            <span className="text-ink-main font-medium opacity-80 font-sans not-italic relative z-10">Local. Private. Fast.</span>
            <svg className="absolute -bottom-2 left-0 w-full h-3 text-green-500" viewBox="0 0 100 15" preserveAspectRatio="none">
              <path d="M 2 5 Q 50 -2 98 6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              <path d="M 5 11 Q 50 4 95 12" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            </svg>
          </span>
        </p>
      </div>

      {/* Indented Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative w-full max-w-4xl mx-auto transition-all duration-500 ease-out transform
          min-h-[320px] flex flex-col items-center justify-center backdrop-blur-sm
          rounded-sm bg-paper-dark/30 shadow-pressed
          ${isDragging
            ? 'shadow-[inset_4px_4px_10px_rgba(0,0,0,0.1),inset_-4px_-4px_10px_rgba(255,255,255,0.9)] bg-paper-dark/50'
            : 'hover:shadow-[inset_3px_3px_8px_rgba(0,0,0,0.08),inset_-3px_-3px_8px_rgba(255,255,255,0.9)]'}
        `}
      >
        {/* Standard File Input (Overlay) */}
        <input
          type="file"
          multiple
          accept="image/*"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          onChange={handleFileInput}
          title=""
        />

        <div className="flex flex-col items-center justify-center text-center pointer-events-none p-8 space-y-8 relative z-0">
          <div className={`
            relative w-24 h-24 flex items-center justify-center rounded-full
            transition-all duration-500 bg-paper-base shadow-card
            ${isDragging ? 'scale-110' : ''}
          `}>
            <Upload className="w-8 h-8 text-ink-muted" strokeWidth={1.5} />
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl font-bold tracking-tight text-ink-main">
              {isDragging ? "Release to Import" : "Drop Photos Here"}
            </h2>
            <div className="flex gap-4 justify-center text-xs text-ink-muted font-medium tracking-widest uppercase">
              <span>JPG</span>
              <span>PNG</span>
              <span>WEBP</span>
              <span>HEIC</span>
            </div>
          </div>

          <div className="flex items-center gap-4 pointer-events-auto relative z-20">
            <button className="px-6 py-3 bg-white border border-white rounded-sm text-ink-main text-sm font-bold tracking-wide shadow-card hover:-translate-y-0.5 transition-all flex items-center gap-2">
              <ImagePlus size={16} />
              Select Files
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};