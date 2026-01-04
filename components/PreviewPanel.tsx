import React, { useState, useEffect, useRef } from 'react';
import { X, Check, ArrowRight, ArrowLeft, Move } from 'lucide-react';
import { ImageFile, AppSettings } from '../types';
import { processImage } from '../services/imageProcessor';

interface PreviewPanelProps {
  image: ImageFile;
  settings: AppSettings;
  updateSettings: (s: AppSettings) => void;

  onClose: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  mode?: 'general' | 'placement';
  inline?: boolean;
  onNext?: () => void;
  onPrev?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  image, settings, updateSettings, onClose, onSave, onCancel, mode = 'general',
  inline = false, onNext, onPrev, hasPrev = false, hasNext = false
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);

  // Placement Mode: Trust the prop from parent
  const isPlacementMode = mode === 'placement';

  const [isGenerating, setIsGenerating] = useState(!isPlacementMode);

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

    // In signature placement mode, we don't need a spinner for processing because we are composing locally
    // If in General Mode, we DO need spinner while worker processes
    const shouldShowSpinner = !isPlacementMode;
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
    if (isPlacementMode || inline) return; // Disable slider when in placement or inline mode
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
  }, [isDraggingSign, localSignPos, settings]);

  console.log('[PreviewPanel] Render:', {
    mode,
    inline,
    hasImage: !!image,
    url: image?.previewUrl,
    dims: image?.originalDimensions,
    processed: processedUrl ? 'YES' : 'NO'
  });


  return (
    <>
      {/* Backdrop - Only if NOT inline */}
      {!inline && (
        <div
          className="fixed inset-0 z-40 bg-white/60 backdrop-blur-sm animate-in fade-in duration-500"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div className={inline
        ? "w-full h-full flex flex-col relative bg-paper-base overflow-hidden"
        : "fixed top-4 bottom-4 right-4 w-full max-w-2xl z-50 bg-paper-base rounded-sm shadow-float flex flex-col overflow-hidden animate-in slide-in-from-right duration-500 border border-white"
      }>

        {/* Header */}
        <div className="h-16 flex items-center justify-between px-8 bg-white/50 border-b border-ink-muted/10">
          <div>
            <h3 className="text-sm font-bold text-ink-main tracking-tight">Inspector</h3>
            <p className="text-xs text-ink-muted truncate max-w-[300px]">{image.file.name}</p>
          </div>

          <div className="flex items-center gap-4">
            {isPlacementMode && (
              <>
                <div className="flex items-center gap-2 bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold border border-yellow-100">
                  <Move size={12} />
                  <span>Drag to Place</span>
                </div>
                {/* PC ONLY: Done Button in Header */}
                {/* Tick & Cross Buttons Logic - Replaced "Done" Button */}
                <div className="flex items-center gap-3">
                  {/* Cancel (Cross) */}
                  <button
                    onClick={onCancel || onClose}
                    className="w-8 h-8 rounded-full bg-red-50 text-red-500 border border-red-100 flex items-center justify-center hover:bg-red-100 transition-all hover:scale-105 active:scale-95"
                    title="Cancel Changes"
                  >
                    <X size={16} strokeWidth={2.5} />
                  </button>

                  {/* Save (Tick) */}
                  <button
                    onClick={onSave || onClose}
                    className="w-8 h-8 rounded-full bg-apple-green/10 text-apple-green border border-apple-green/20 flex items-center justify-center hover:bg-apple-green/20 transition-all hover:scale-105 active:scale-95"
                    title="Save Changes"
                  >
                    <Check size={16} strokeWidth={2.5} />
                  </button>
                </div>
              </>
            )}

            {!isPlacementMode && (
              inline ? (
                /* INLINE MODE: Tick & Cross Buttons */
                <div className="flex items-center gap-3">
                  {/* Cancel (Cross) */}
                  <button
                    onClick={onCancel || onClose}
                    className="w-8 h-8 rounded-full bg-red-50 text-red-500 border border-red-100 flex items-center justify-center hover:bg-red-100 transition-all hover:scale-105 active:scale-95"
                    title="Cancel Changes"
                  >
                    <X size={16} strokeWidth={2.5} />
                  </button>

                  {/* Save (Tick) */}
                  <button
                    onClick={onSave || onClose}
                    className="w-8 h-8 rounded-full bg-apple-green/10 text-apple-green border border-apple-green/20 flex items-center justify-center hover:bg-apple-green/20 transition-all hover:scale-105 active:scale-95"
                    title="Save Changes"
                  >
                    <Check size={16} strokeWidth={2.5} />
                  </button>
                </div>
              ) : (
                /* MODAL MODE: Back Arrow */
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white text-ink-muted hover:text-ink-main border border-ink-muted/10 flex items-center justify-center hover:shadow-sm transition-all"
                >
                  <ArrowRight size={18} />
                </button>
              )
            )}
          </div>
        </div>

        {/* Content - Constrained to match Modal Width if inline, maintaining consistency */}
        <div className={`flex-1 relative flex flex-col items-center justify-center p-2 overflow-hidden bg-paper-dark/10 ${inline ? 'max-w-2xl mx-auto w-full border-x border-ink-muted/5' : 'w-full'}`}>

          {/* Show Spinner ONLY if required */}
          {/* Processing Overlay - Non-blocking visibility of original */}
          {isGenerating && !isPlacementMode && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/50 backdrop-blur-[1px]">
              <div className="w-8 h-8 border-2 border-ink-muted/30 border-t-ink-main rounded-full animate-spin"></div>
            </div>
          )}

          <div className="flex flex-col gap-6 w-full h-full">

            {/* Parent Flex Container to Center the Constrained Image */}
            <div className="flex-1 w-full flex items-center justify-center p-4 overflow-hidden relative">

              {/* CONSTRAINED WRAPPER: Matches Image Aspect Ratio Exactly */}
              <div
                ref={containerRef}
                className={`relative shadow-card border border-white overflow-hidden
                              ${isPlacementMode ? 'cursor-default' : 'cursor-ew-resize'}
                          `}
                style={{
                  minWidth: '200px',
                  minHeight: '200px',
                  aspectRatio: image.originalDimensions && image.originalDimensions.width > 0
                    ? `${image.originalDimensions.width} / ${image.originalDimensions.height}`
                    : '16 / 9',
                  width: image.originalDimensions && image.originalDimensions.width > 0
                    ? (image.originalDimensions.width > image.originalDimensions.height ? '100%' : 'auto')
                    : '100%',
                  height: image.originalDimensions && image.originalDimensions.width > 0
                    ? (image.originalDimensions.height >= image.originalDimensions.width ? '100%' : 'auto')
                    : '100%',
                  maxWidth: '100%',
                  maxHeight: '100%'
                }}
                onMouseMove={!isPlacementMode ? handleSliderMove : undefined}
                onTouchMove={!isPlacementMode ? handleSliderMove : undefined}
              >
                {/* Background (Original) */}
                <div className="absolute inset-0 w-full h-full bg-[url('https://placehold.co/20x20/e5e7eb/ffffff?text=')] opacity-30"></div>

                {/* If Signing: Show Original FULL opacity underneath + Signature Overlay */}
                {isPlacementMode ? (
                  <img
                    src={image.previewUrl}
                    alt="Original"
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
                  />
                ) : (
                  <img
                    src={image.previewUrl}
                    alt="Original"
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                )}


                {/* Slider Mode: Foreground (Processed) - Clipped or Full if Inline */}
                {!isPlacementMode && processedUrl && (
                  <div
                    className="absolute inset-0 w-full h-full overflow-hidden border-r border-accent-gold/50"
                    style={{ clipPath: inline ? 'none' : `inset(0 ${100 - sliderPosition}% 0 0)` }}
                  >
                    <img
                      src={processedUrl}
                      alt="Processed"
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                  </div>
                )}

                {/* Slider Handle (Only in compare mode AND not inline) */}
                {!isPlacementMode && !inline && (
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

                {/* Signature Interactive Layer - USES LOCAL STATE - ONLY IN PLACEMENT MODE */}
                {isPlacementMode && settings.signature.imageData && (
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

                {/* Confirm Button for Mobile/Touch (Signature Mode Only) */}
                {/* Visual FAB only on Mobile now */}
                {isPlacementMode && (
                  <div className={`
                        absolute z-30 animate-in zoom-in-95 duration-300
                        bottom-6 left-1/2 -translate-x-1/2 
                        md:hidden /* Hidden on Desktop */
                    `}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                      }}
                      className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full font-bold shadow-xl border border-white/20 hover:scale-105 active:scale-95 transition-all"
                    >
                      <Check size={18} strokeWidth={3} />
                      <span>Done</span>
                    </button>
                  </div>
                )}

                {/* Labels */}
                {!isPlacementMode && !inline && !settings.watermark.enabled ? <>
                  <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-sm text-[10px] text-ink-muted font-bold tracking-wider shadow-sm">ORIGINAL</div>
                  <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-sm text-[10px] text-accent-gold font-bold tracking-wider shadow-sm">PROCESSED</div>
                </> : null}
              </div>

              {hasPrev && onPrev && (
                <button
                  onClick={(e) => { e.stopPropagation(); onPrev(); }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-30 p-4 bg-white/50 hover:bg-white backdrop-blur-md rounded-full shadow-sm text-ink-main transition-all hover:scale-110 active:scale-95 group"
                >
                  <ArrowLeft size={24} className="group-hover:-translate-x-0.5 transition-transform opacity-70 group-hover:opacity-100" />
                </button>
              )}
              {hasNext && onNext && (
                <button
                  onClick={(e) => { e.stopPropagation(); onNext(); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-30 p-4 bg-white/50 hover:bg-white backdrop-blur-md rounded-full shadow-sm text-ink-main transition-all hover:scale-110 active:scale-95 group"
                >
                  <ArrowRight size={24} className="group-hover:translate-x-0.5 transition-transform opacity-70 group-hover:opacity-100" />
                </button>
              )}
            </div>

            {/* Stats */}
            {isGenerating && isPlacementMode && (
              <div className="absolute top-4 right-4">
                <div className="w-4 h-4 border-2 border-accent-gold/60 border-t-accent-gold rounded-full animate-spin"></div>
              </div>
            )}

            {/* Stats Panel - Always Visible */}
            <div className="min-h-24 bg-white rounded-sm p-6 grid grid-cols-3 gap-6 shadow-card border border-white relative z-10">
              <div className="flex flex-col justify-center">
                <span className="text-[10px] text-ink-muted uppercase tracking-wider font-medium">Original Size</span>
                <span className="text-sm font-bold text-ink-main font-mono mt-1">{(image.file.size / 1024).toFixed(1)} KB</span>
              </div>
              <div className="flex flex-col justify-center border-l border-ink-muted/10 pl-6">
                <span className="text-[10px] text-ink-muted uppercase tracking-wider font-medium">Efficiency</span>
                <span className="text-sm font-bold text-ink-main font-mono mt-1 text-accent-gold">
                  {settings.convert.quality <= 0.4 ? 'Max Compression' :
                    settings.convert.quality >= 0.99 ? 'Max Quality' : 'Balanced'}
                </span>
              </div>
              <div className="flex flex-col justify-center border-l border-ink-muted/10 pl-6">
                <span className="text-[10px] text-ink-muted uppercase tracking-wider font-medium">Format</span>
                <span className="text-sm font-bold text-ink-main font-mono mt-1">{settings.convert.format.split('/')[1].toUpperCase()}</span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </>
  );
};
// Reviewed
