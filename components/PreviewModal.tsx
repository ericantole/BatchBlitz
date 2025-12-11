import React, { useState, useEffect, useRef } from 'react';
import { X, Check } from 'lucide-react';
import { ImageFile, AppSettings } from '../types';
import { processImage } from '../services/imageProcessor';

interface PreviewModalProps {
  image: ImageFile;
  settings: AppSettings;
  onClose: () => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({ image, settings, onClose }) => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-5xl h-[80vh] bg-surface border border-white/10 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-surface">
            <div>
                <h3 className="text-lg font-medium text-white">{image.file.name}</h3>
                <div className="flex gap-4 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">Original</span>
                    <span className="flex items-center gap-1 text-violet-400">Processed Preview</span>
                </div>
            </div>
            <button 
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-full transition-colors"
            >
                <X className="text-zinc-400" />
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 relative bg-void flex items-center justify-center p-8 overflow-hidden">
            {isGenerating ? (
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-zinc-500 text-sm">Rendering preview...</span>
                </div>
            ) : (
                <div 
                    ref={containerRef}
                    className="relative w-full h-full max-w-4xl max-h-full select-none cursor-ew-resize group"
                    onMouseMove={handleMouseMove}
                    onTouchMove={handleMouseMove}
                >
                    {/* Background (Original) */}
                    <img 
                        src={image.previewUrl} 
                        alt="Original" 
                        className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-50 grayscale"
                    />
                     <div className="absolute top-4 left-4 bg-black/50 backdrop-blur px-2 py-1 rounded text-xs text-white">Original</div>

                    {/* Foreground (Processed) - Clipped */}
                    {processedUrl && (
                        <div 
                            className="absolute inset-0 w-full h-full overflow-hidden"
                            style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                        >
                            <img 
                                src={processedUrl} 
                                alt="Processed" 
                                className="absolute inset-0 w-full h-full object-contain pointer-events-none" 
                            />
                            <div className="absolute top-4 right-4 bg-violet-600/90 backdrop-blur px-2 py-1 rounded text-xs text-white">After</div>
                        </div>
                    )}

                    {/* Slider Handle */}
                    <div 
                        className="absolute top-0 bottom-0 w-0.5 bg-violet-500 cursor-ew-resize z-10 shadow-[0_0_10px_rgba(139,92,246,0.5)]"
                        style={{ left: `${sliderPosition}%` }}
                    >
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-violet-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                            <div className="flex gap-0.5">
                                <div className="w-0.5 h-3 bg-white/50"></div>
                                <div className="w-0.5 h-3 bg-white/50"></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Footer info */}
        <div className="h-12 border-t border-white/5 bg-surface/50 px-6 flex items-center justify-between text-xs text-zinc-400">
            <span>Drag slider to compare</span>
            {processedUrl && (
                <div className="flex items-center gap-2">
                    <Check size={14} className="text-green-500" />
                    <span>Processing successful</span>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};