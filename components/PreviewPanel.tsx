import React, { useState, useEffect, useRef } from 'react';
import { X, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { ImageFile, AppSettings } from '../types';
import { processImage } from '../services/imageProcessor';

interface PreviewPanelProps {
  image: ImageFile;
  settings: AppSettings;
  onClose: () => void;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ image, settings, onClose }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    setIsGenerating(true);

    const generatePreview = async () => {
      try {
        const result = await processImage(image.file, settings);
        if (mounted) {
          setProcessedUrl(result.url);
          setIsGenerating(false);
        }
      } catch (err) {
        console.error("Preview generation failed", err);
        if (mounted) setIsGenerating(false);
      }
    };

    generatePreview();

    return () => {
      mounted = false;
    };
  }, [image, settings]);

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;
    setSliderPosition(percentage);
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-white/60 backdrop-blur-sm animate-in fade-in duration-500"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed top-4 bottom-4 right-4 w-full max-w-2xl z-50 bg-paper-base rounded-sm shadow-float flex flex-col overflow-hidden animate-in slide-in-from-right duration-500 border border-white">
        
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-8 bg-white/50 border-b border-ink-muted/10">
            <div>
                <h3 className="text-sm font-bold text-ink-main tracking-tight">Inspector</h3>
                <p className="text-xs text-ink-muted truncate max-w-[300px]">{image.file.name}</p>
            </div>
            <button 
                onClick={onClose}
                className="p-2 hover:bg-black/5 rounded-full transition-all text-ink-muted hover:text-ink-main"
            >
                <ArrowRight size={20} strokeWidth={1.5} />
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 relative flex flex-col items-center justify-center p-8 overflow-hidden bg-paper-dark/10">
            {isGenerating ? (
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-ink-muted/30 border-t-ink-main rounded-full animate-spin"></div>
                    <span className="text-ink-muted text-xs font-medium tracking-wide">Rendering preview...</span>
                </div>
            ) : (
                <div className="flex flex-col gap-6 w-full h-full">
                    {/* Compare View */}
                    <div 
                        ref={containerRef}
                        className="relative flex-1 w-full bg-white rounded-sm cursor-ew-resize group shadow-card border border-white"
                        onMouseMove={handleMouseMove}
                        onTouchMove={handleMouseMove}
                    >
                        {/* Background (Original) */}
                        <div className="absolute inset-0 w-full h-full bg-[url('https://placehold.co/20x20/e5e7eb/ffffff?text=')] opacity-30"></div>
                        <img 
                            src={image.previewUrl} 
                            alt="Original" 
                            className="absolute inset-0 w-full h-full object-contain p-4"
                        />
                        
                        {/* Foreground (Processed) - Clipped */}
                        {processedUrl && (
                            <div 
                                className="absolute inset-0 w-full h-full overflow-hidden bg-white border-r border-accent-gold/50"
                                style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                            >
                                <img 
                                    src={processedUrl} 
                                    alt="Processed" 
                                    className="absolute inset-0 w-full h-full object-contain p-4" 
                                />
                            </div>
                        )}

                        {/* Slider Handle */}
                        <div 
                            className="absolute top-0 bottom-0 w-px bg-accent-gold z-10"
                            style={{ left: `${sliderPosition}%` }}
                        >
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border border-white">
                                <div className="flex gap-1">
                                    <div className="w-px h-3 bg-ink-muted/30"></div>
                                    <div className="w-px h-3 bg-ink-muted/30"></div>
                                </div>
                            </div>
                        </div>

                        {/* Labels */}
                         <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-sm text-[10px] text-ink-muted font-bold tracking-wider shadow-sm">ORIGINAL</div>
                         <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-sm text-[10px] text-accent-gold font-bold tracking-wider shadow-sm">PROCESSED</div>
                    </div>

                    {/* Stats */}
                    <div className="h-24 bg-white rounded-sm p-6 grid grid-cols-3 gap-6 shadow-card border border-white">
                        <div className="flex flex-col justify-center">
                            <span className="text-[10px] text-ink-muted uppercase tracking-wider font-medium">Original Size</span>
                            <span className="text-sm font-bold text-ink-main font-mono mt-1">{(image.file.size / 1024).toFixed(1)} KB</span>
                        </div>
                        <div className="flex flex-col justify-center border-l border-ink-muted/10 pl-6">
                             <span className="text-[10px] text-ink-muted uppercase tracking-wider font-medium">Est. Output</span>
                             <span className="text-sm font-bold text-ink-main font-mono mt-1 text-accent-gold">~{(image.file.size * 0.8 / 1024).toFixed(1)} KB</span>
                        </div>
                         <div className="flex flex-col justify-center border-l border-ink-muted/10 pl-6">
                             <span className="text-[10px] text-ink-muted uppercase tracking-wider font-medium">Format</span>
                             <span className="text-sm font-bold text-ink-main font-mono mt-1">{settings.convert.format.split('/')[1].toUpperCase()}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </>
  );
};