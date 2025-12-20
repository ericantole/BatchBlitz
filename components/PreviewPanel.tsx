import React, { useState, useEffect, useRef } from 'react';
import { X, Check, ArrowRight, ArrowLeft, Move } from 'lucide-react';
import { ImageFile, AppSettings } from '../types';
import { processImage } from '../services/imageProcessor';

interface PreviewPanelProps {
  image: ImageFile;
  settings: AppSettings;
  updateSettings: (s: AppSettings) => void;
  onClose: () => void;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ image, settings, updateSettings, onClose }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);

  // Dragging State
  const [isDraggingSign, setIsDraggingSign] = useState(false);
  const [localSignPos, setLocalSignPos] = useState({ x: 50, y: 50 }); // Local state for smooth dragging
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync Local State when Settings Change externally
  useEffect(() => {
    if (!isDraggingSign) {
      setLocalSignPos(settings.signature.position);
    }
  }, [settings.signature.position, isDraggingSign]);

  useEffect(() => {
    let mounted = true;

    // In signature mode, we don't block the UI with a spinner because we are compositing client-side
    // We only show spinner if we aren't in signature mode OR if we have no processed image yet (initial load)
    const shouldShowSpinner = !settings.signature.enabled;
    if (shouldShowSpinner) setIsGenerating(true);

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

  // --- Compare Slider Logic ---
  const handleSliderMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (settings.signature.enabled) return; // Disable slider when in sign mode
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;
    setSliderPosition(percentage);
  };

  // --- Signature Drag Logic ---
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDraggingSign(true);
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDraggingSign || !containerRef.current) return;

    e.preventDefault(); // Prevent scroll while dragging

    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    // Calculate relative position within container
    let x = clientX - rect.left;
    let y = clientY - rect.top;

    // Clamp to container
    x = Math.max(0, Math.min(x, rect.width));
    y = Math.max(0, Math.min(y, rect.height));

    // Convert to percentage
    const xPct = (x / rect.width) * 100;
    const yPct = (y / rect.height) * 100;

    // Update LOCAL state only - this is instant and doesn't trigger expensive re-renders higher up
    setLocalSignPos({ x: xPct, y: yPct });
  };

  const handleDragEnd = () => {
    setIsDraggingSign(false);
    // Commit to global settings on drag end
    updateSettings({
      ...settings,
      signature: {
        ...settings.signature,
        position: localSignPos
      }
    });
  };

  // Attach global mouse-up listener when dragging starts
  useEffect(() => {
    if (isDraggingSign) {
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchend', handleDragEnd);
      window.addEventListener('mousemove', handleDragMove as any); // Cast for native event typing match
      window.addEventListener('touchmove', handleDragMove as any, { passive: false });
    }
    return () => {
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchend', handleDragEnd);
      window.removeEventListener('mousemove', handleDragMove as any);
      window.removeEventListener('touchmove', handleDragMove as any);
    };
  }, [isDraggingSign, localSignPos, settings]); // Added localSignPos to deps so closure has latest value


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

          {settings.signature.enabled && (
            <div className="flex items-center gap-2 bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold border border-yellow-100">
              <Move size={12} />
              <span>Drag Signature to Place</span>
            </div>
          )}

          <button
            onClick={onClose}
            className="p-2 hover:bg-black/5 rounded-full transition-all text-ink-muted hover:text-ink-main"
          >
            <ArrowRight size={20} strokeWidth={1.5} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 relative flex flex-col items-center justify-center p-8 overflow-hidden bg-paper-dark/10">

          {/* Show Spinner ONLY if we are generating AND NOT in signature mode (or if we truly have nothing to show) */}
          {isGenerating && !settings.signature.enabled ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-2 border-ink-muted/30 border-t-ink-main rounded-full animate-spin"></div>
              <span className="text-ink-muted text-xs font-medium tracking-wide">Rendering preview...</span>
            </div>
          ) : (
            <div className="flex flex-col gap-6 w-full h-full">

              {/* Interactive Canvas */}
              <div
                ref={containerRef}
                className={`relative flex-1 w-full bg-white rounded-sm group shadow-card border border-white overflow-hidden
                            ${settings.signature.enabled ? 'cursor-default' : 'cursor-ew-resize'}
                        `}
                onMouseMove={!settings.signature.enabled ? handleSliderMove : undefined}
                onTouchMove={!settings.signature.enabled ? handleSliderMove : undefined}
              >
                {/* Background (Original) */}
                <div className="absolute inset-0 w-full h-full bg-[url('https://placehold.co/20x20/e5e7eb/ffffff?text=')] opacity-30"></div>

                {/* If Signing: Show Original FULL opacity underneath + Signature Overlay */}
                {settings.signature.enabled ? (
                  <img
                    src={image.previewUrl}
                    alt="Original"
                    className="absolute inset-0 w-full h-full object-contain p-4 pointer-events-none select-none"
                  />
                ) : (
                  <img
                    src={image.previewUrl}
                    alt="Original"
                    className="absolute inset-0 w-full h-full object-contain p-4"
                  />
                )}


                {/* Slider Mode: Foreground (Processed) - Clipped */}
                {!settings.signature.enabled && processedUrl && (
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

                {/* Signature Interactive Layer - USES LOCAL STATE */}
                {settings.signature.enabled && settings.signature.imageData && (
                  <div
                    className="absolute z-20 cursor-move group"
                    style={{
                      left: `${localSignPos.x}%`,
                      top: `${localSignPos.y}%`,
                      // Use translate to center the anchor point
                      transform: 'translate(-50%, -50%)',
                      width: `${settings.signature.scale}%`,
                      maxWidth: '100%',
                    }}
                    onMouseDown={handleDragStart}
                    onTouchStart={handleDragStart}
                  >
                    <div className={`relative border-2 ${isDraggingSign ? 'border-accent-gold' : 'border-transparent group-hover:border-dashed group-hover:border-ink-muted/50'} rounded transition-colors p-1`}>
                      <img
                        src={settings.signature.imageData}
                        alt="Signature"
                        className="w-full h-auto pointer-events-none select-none drop-shadow-md"
                      />
                      {/* Drag Handle Indicator */}
                      <div className="absolute -top-2 -right-2 w-4 h-4 bg-white border border-gray-200 rounded-full shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Move size={8} className="text-ink-muted" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Slider Handle (Only in compare mode) */}
                {!settings.signature.enabled && (
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
                )}

                {/* Labels */}
                {!settings.signature.enabled && <>
                  <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-sm text-[10px] text-ink-muted font-bold tracking-wider shadow-sm">ORIGINAL</div>
                  <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-sm text-[10px] text-accent-gold font-bold tracking-wider shadow-sm">PROCESSED</div>
                </>}
              </div>

              {/* Stats */}
              {isGenerating && settings.signature.enabled && (
                <div className="absolute top-4 right-4">
                  <div className="w-4 h-4 border-2 border-accent-gold/30 border-t-accent-gold rounded-full animate-spin"></div>
                </div>
              )}

              {!settings.signature.enabled && (
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
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};