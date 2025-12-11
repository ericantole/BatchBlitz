import React, { useCallback, useState } from 'react';
import { Upload, FileImage, Sparkles, Zap } from 'lucide-react';

interface DropzoneProps {
  onFilesDropped: (files: File[]) => void;
  compact?: boolean;
}

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
    <div className="w-full flex flex-col items-center justify-center space-y-12 animate-in fade-in zoom-in duration-500">
      
      {/* Hero Text */}
      <div className="text-center space-y-4">
        <h1 className="text-6xl md:text-8xl font-serif font-bold text-ink-main drop-shadow-sm tracking-tighter">
          BatchBlitz
        </h1>
        <p className="text-lg md:text-xl text-ink-muted font-light max-w-2xl mx-auto text-center font-serif italic">
          The studio for your images. 
          <span className="text-ink-main ml-2 font-medium opacity-80 font-sans not-italic">Local. Private. Fast.</span>
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
        <input 
          type="file" 
          multiple 
          accept="image/*" 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          onChange={handleFileInput}
        />
        
        <div className="flex flex-col items-center justify-center text-center pointer-events-none p-8 space-y-8">
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
          
          <button className="px-8 py-3 bg-white border border-white rounded-sm text-ink-main text-sm font-bold tracking-wide shadow-card hover:translate-y-[-1px] transition-all">
            Select from Device
          </button>
        </div>
      </div>
    </div>
  );
};