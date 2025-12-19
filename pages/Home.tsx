import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Dropzone } from '../components/Dropzone';
import { Sidebar } from '../components/Sidebar';
import { ImageGrid } from '../components/ImageGrid';
import { Button } from '../components/Button';
import { PreviewPanel } from '../components/PreviewPanel';
import { PaywallModal } from '../components/PaywallModal';
import { SecurityModal } from '../components/SecurityModal';
import { LoginModal } from '../components/LoginModal';
import { Navbar } from '../components/Navbar';
import { DEFAULT_SETTINGS, MAX_FREE_FILES } from '../constants';
import { ImageFile, ImageStatus, AppSettings } from '../types';
import { processImage } from '../services/imageProcessor';
import { normalizeImageFile } from '../utils/imageUtils';
import { Download, Eraser, Trash2, Lock, X, Settings2, Package, RefreshCw, Play, Check, Plus } from 'lucide-react';
import { useStore } from '../store/useStore';
import JSZip from 'jszip';
import saveAs from 'file-saver';

const generateId = () => Math.random().toString(36).substring(2, 15);

// Re-implemented Marquee Component
const Ticker = () => (
    <div className="fixed bottom-0 w-full h-10 bg-white/80 backdrop-blur-md border-t border-ink-muted/10 flex items-center overflow-hidden z-10 pointer-events-none">
        <div className="animate-scroll whitespace-nowrap flex gap-16 text-[11px] font-medium tracking-[0.2em] text-ink-muted uppercase">
            <span>No Servers</span>
            <span>Local Processing</span>
            <span>HEIC Support</span>
            <span>Batch Resize</span>
            <span>100% Privacy</span>
            <span>Client-Side</span>
            <span>No Uploads</span>
            <span>Super Fast</span>
            <span>No Servers</span>
            <span>Local Processing</span>
            <span>HEIC Support</span>
            <span>Batch Resize</span>
            <span>100% Privacy</span>
            <span>Client-Side</span>
            <span>No Uploads</span>
            <span>Super Fast</span>
        </div>
    </div>
);

export const Home: React.FC = () => {
  const { user, isPro, togglePro } = useStore();
  const [images, setImages] = useState<ImageFile[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [selectedImage, setSelectedImage] = useState<ImageFile | null>(null);
  
  // State Machine Logic
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isDirty, setIsDirty] = useState(false); // True if settings changed AFTER processing

  const [showPaywall, setShowPaywall] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isMobileSettingsOpen, setIsMobileSettingsOpen] = useState(false);
  
  const fabInputRef = useRef<HTMLInputElement>(null);

  // Monitor Settings for Dirty State
  useEffect(() => {
    if (isCompleted) {
        setIsDirty(true);
    }
  }, [settings]); 

  const handleSettingsUpdate = (newSettings: AppSettings) => {
      setSettings(newSettings);
  };

  const handleFilesDropped = useCallback(async (files: File[]) => {
    const normalizedFiles = await Promise.all(
        files.map(async (file) => {
             // Extract relative path if available (from directory uploads)
             const rawPath = (file as any).webkitRelativePath || '';
             // Remove the filename from the path to get just the directory structure
             const path = rawPath ? rawPath.substring(0, rawPath.lastIndexOf('/') + 1) : '';

             const normalized = await normalizeImageFile(file);
             return {
                 id: generateId(),
                 file: normalized,
                 path: path, // Store the folder structure
                 previewUrl: URL.createObjectURL(normalized),
                 status: ImageStatus.IDLE
             };
        })
    );
    
    setImages(prev => {
        const combined = [...prev, ...normalizedFiles];
        // Reset states on new files
        setIsCompleted(false);
        setIsDirty(false); 

        if (combined.length > MAX_FREE_FILES && !isPro) {
            setShowPaywall(true);
            return combined.slice(0, MAX_FREE_FILES);
        }
        return combined;
    });
  }, [isPro]);

  const handleRemoveImage = (id: string) => {
    setImages(prev => {
        const target = prev.find(img => img.id === id);
        if (target) URL.revokeObjectURL(target.previewUrl);
        return prev.filter(img => img.id !== id);
    });
    setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
    });
    // Check if empty to reset states
    if (images.length <= 1) {
        setIsCompleted(false);
        setIsDirty(false);
    }
  };

  const handleToggleSelection = (id: string) => {
    setSelectedIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
    });
  };

  const handleRemoveSelected = () => {
    selectedIds.forEach(id => {
        const img = images.find(i => i.id === id);
        if (img) URL.revokeObjectURL(img.previewUrl);
    });
    setImages(prev => prev.filter(img => !selectedIds.has(img.id)));
    setSelectedIds(new Set());
  };

  const handleClearAll = () => {
    if (images.length > 0) {
        if (!window.confirm("Start over? This will clear all images.")) return;
        images.forEach(img => URL.revokeObjectURL(img.previewUrl));
        setImages([]);
        setSelectedIds(new Set());
        setIsProcessing(false);
        setIsCompleted(false);
        setIsDirty(false);
    }
  };

  const processBatch = async () => {
    setIsProcessing(true);
    setIsDirty(false); // Reset dirty flag as we are re-processing
    
    let currentImages = [...images];
    
    // Optimistic Update
    setImages(prev => prev.map(img => ({...img, status: ImageStatus.PROCESSING })));

    // Sequential Processing (for stability)
    for (let i = 0; i < currentImages.length; i++) {
        const img = currentImages[i];
        try {
            const result = await processImage(img.file, settings);
            setImages(prev => prev.map(p => p.id === img.id ? {
                ...p,
                status: ImageStatus.COMPLETED,
                processedUrl: result.url,
                processedDimensions: { width: result.width, height: result.height }
            } : p));
        } catch (error) {
            console.error(error);
             setImages(prev => prev.map(p => p.id === img.id ? { ...p, status: ImageStatus.ERROR } : p));
        }
        await new Promise(r => setTimeout(r, 20)); // Micro-yield
    }
    
    setIsProcessing(false);
    setIsCompleted(true);
  };

  const getNewFilename = (originalName: string, index: number) => {
    const { rename } = settings;
    if (!rename.enabled) {
        const namePart = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
        return `${namePart}_batchblitz`;
    }

    let pattern = rename.pattern;
    if (!isPro && pattern !== '{original}_{n}') {
         pattern = '{original}_{n}';
    }

    const namePart = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
    const dateStr = new Date().toISOString().split('T')[0];
    const sequenceNumber = index + (rename.startSequence || 1);

    return pattern
        .replace(/{original}/g, namePart)
        .replace(/{n}/g, sequenceNumber.toString())
        .replace(/{date}/g, dateStr);
  };

  const downloadAll = async () => {
    const completedImages = images.filter(img => img.status === ImageStatus.COMPLETED && img.processedUrl);
    if (completedImages.length === 0) return;

    if (completedImages.length === 1) {
        const img = completedImages[0];
        const a = document.createElement('a');
        a.href = img.processedUrl!;
        const ext = settings.convert.format.split('/')[1];
        const newName = getNewFilename(img.file.name, 0);
        
        a.download = `${newName}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } else {
        try {
            const zip = new JSZip();
            const ext = settings.convert.format.split('/')[1];
            await Promise.all(completedImages.map(async (img, index) => {
                const newName = getNewFilename(img.file.name, index);
                const fullFilename = `${newName}.${ext}`;
                const response = await fetch(img.processedUrl!);
                const blob = await response.blob();
                
                // --- FOLDER SUPPORT ---
                if (img.path) {
                    // Recreate original directory structure in zip
                    zip.folder(img.path)?.file(fullFilename, blob);
                } else {
                    zip.file(fullFilename, blob);
                }
            }));
            const content = await zip.generateAsync({ type: 'blob' });
            saveAs(content, 'BatchBlitz_Export.zip');
        } catch (error) {
            console.error('Failed to zip files:', error);
            alert('Failed to create zip file. Try downloading individually.');
        }
    }
  };

  const handleFabClick = () => {
      fabInputRef.current?.click();
  };

  const handleFabChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          handleFilesDropped(Array.from(e.target.files));
      }
      // Reset value to allow selecting same files again if needed
      if (fabInputRef.current) fabInputRef.current.value = '';
  }

  // Button Logic for Mobile Dock
  const getButtonState = () => {
      if (isProcessing) return { text: 'Processing...', disabled: true, variant: 'secondary' as const, icon: RefreshCw, spin: true };
      if (isCompleted && !isDirty) return { text: 'Processed', disabled: true, variant: 'glass' as const, icon: Check };
      if (isCompleted && isDirty) return { text: 'Apply Changes', disabled: false, variant: 'neon' as const, icon: RefreshCw };
      return { text: 'Start Batch', disabled: false, variant: 'primary' as const, icon: Play };
  };
  const btnState = getButtonState();
  const BtnIcon = btnState.icon;

  const hasImages = images.length > 0;
  const selectionCount = selectedIds.size;

  return (
    <div className="flex flex-col min-h-screen w-full text-ink-main font-sans relative bg-paper-base bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]">
      <Navbar 
        onLoginClick={() => setShowLogin(true)} 
        onReset={() => handleClearAll()}
        hasImages={hasImages}
      />

      {/* Ticker - Only visible when NO images */}
      {!hasImages && <Ticker />}

      {/* Dev Mode Badge (Clickable Toggle) */}
      <button 
        onClick={togglePro}
        className={`
            fixed bottom-12 left-2 z-[100] border backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 hidden md:flex transition-all hover:scale-105 active:scale-95
            ${isPro 
                ? 'bg-accent-gold/10 border-accent-gold/20 text-accent-gold' 
                : 'bg-gray-200/50 border-gray-300/50 text-gray-500'}
        `}
      >
          <Lock size={10} /> {isPro ? 'DEV: PRO ENABLED' : 'DEV: FREE MODE'}
      </button>

      {/* Add More FAB */}
      {hasImages && (
          <>
            <button
                onClick={handleFabClick}
                className="fixed bottom-8 left-8 w-14 h-14 bg-black text-white rounded-full shadow-xl flex items-center justify-center z-50 hover:scale-110 active:scale-95 transition-all animate-in zoom-in duration-300"
                title="Add More Images"
            >
                <Plus size={32} strokeWidth={2.5} />
            </button>
            <input 
                type="file" 
                multiple 
                accept="image/*" 
                className="hidden" 
                ref={fabInputRef}
                onChange={handleFabChange}
            />
          </>
      )}

      <div className="flex-1 relative flex flex-col h-screen overflow-hidden pt-20" id="editor">
        
        {/* Empty State */}
        {!hasImages && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 z-20 overflow-y-auto">
                <Dropzone onFilesDropped={handleFilesDropped} />
            </div>
        )}

        {/* Studio Workspace */}
        {hasImages && (
            <div className="flex w-full h-full relative pb-20 md:pb-0">
                
                {/* Main Canvas Area */}
                <div className="flex-1 h-full overflow-hidden relative flex flex-col">
                    
                    {/* Image Grid Scroll Area */}
                    <div className="flex-1 overflow-y-auto overflow-x-hidden p-0 no-scrollbar pb-32">
                        <ImageGrid 
                            images={images} 
                            onRemove={handleRemoveImage} 
                            onSelect={setSelectedImage}
                            selectedIds={selectedIds}
                            onToggleSelection={handleToggleSelection}
                        />
                    </div>

                    {/* Fixed Download Bar (Desktop) - Adjusted Z-Index and Position */}
                    {isCompleted && (
                        <div className={`
                            fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-out transform
                            ${isDirty ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}
                            hidden md:block
                        `}>
                            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-xl border border-white/40 shadow-float rounded-full p-2 pl-4 pr-2 animate-in slide-in-from-bottom-10 fade-in">
                                <div className="text-xs font-medium text-ink-main mr-2">
                                    {images.length} files ready
                                </div>
                                <Button 
                                    onClick={downloadAll} 
                                    variant="primary" 
                                    className="rounded-full shadow-lg h-10 px-6 bg-ink-main text-white hover:scale-105 active:scale-95 transition-all"
                                >
                                    {images.length > 1 ? <Package className="w-4 h-4 mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                                    Download {images.length > 1 ? "ZIP" : ""}
                                </Button>
                                <button 
                                    onClick={() => handleClearAll()}
                                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 text-ink-muted transition-colors"
                                    title="Clear Workspace"
                                >
                                    <Eraser size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Desktop Sidebar (Fixed Right) */}
                <div className="hidden md:block w-[360px] h-full relative z-20">
                   <Sidebar 
                    settings={settings} 
                    updateSettings={handleSettingsUpdate} 
                    isPro={isPro}
                    onShowPaywall={() => setShowPaywall(true)}
                    onShowSecurity={() => setShowSecurity(true)}
                    // State Machine Props
                    onProcess={processBatch}
                    isProcessing={isProcessing}
                    isDirty={isDirty}
                    hasImages={hasImages}
                    isCompleted={isCompleted}
                   />
                </div>

                {/* Mobile Dock (Fixed Bottom) */}
                <div className="md:hidden fixed bottom-0 left-0 w-full p-4 bg-white/90 backdrop-blur-xl border-t border-gray-200 z-50 flex gap-4 pb-8 shadow-[0_-5px_20px_rgba(0,0,0,0.1)]">
                    <button
                        onClick={() => setIsMobileSettingsOpen(true)}
                        className="flex flex-col items-center justify-center w-16 h-14 bg-gray-100 rounded-xl text-ink-main active:scale-95 transition-transform"
                    >
                        <Settings2 size={20} />
                        <span className="text-[10px] font-bold uppercase mt-1">Tune</span>
                    </button>
                    
                    {/* If completed, show Download button instead of process/apply on mobile for space */}
                    {isCompleted && !isDirty ? (
                         <button
                            onClick={downloadAll}
                            className="flex-1 h-14 bg-ink-main text-white rounded-xl flex items-center justify-center gap-2 font-bold text-sm shadow-lg transition-all active:scale-95"
                         >
                            <Download size={18} />
                            Download ZIP
                         </button>
                    ) : (
                        <button
                            onClick={processBatch}
                            disabled={btnState.disabled}
                            className={`
                                flex-1 h-14 rounded-xl flex items-center justify-center gap-2 font-bold text-sm shadow-lg transition-all active:scale-95
                                ${btnState.variant === 'primary' ? 'bg-ink-main text-white' : ''}
                                ${btnState.variant === 'neon' ? 'bg-accent-gold text-white animate-pulse' : ''}
                                ${btnState.variant === 'secondary' ? 'bg-gray-200 text-ink-muted cursor-not-allowed' : ''}
                                ${btnState.variant === 'glass' ? 'bg-green-100 text-green-700 border border-green-200' : ''}
                            `}
                        >
                            {BtnIcon && <BtnIcon size={18} className={btnState.spin ? 'animate-spin' : ''} />}
                            {btnState.text}
                        </button>
                    )}
                </div>

                {/* Mobile Drawer */}
                {isMobileSettingsOpen && (
                    <div className="fixed inset-0 z-[60] md:hidden">
                        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsMobileSettingsOpen(false)} />
                        <div className="absolute bottom-0 left-0 right-0 h-[85vh] bg-[#F5F5F7] rounded-t-3xl shadow-float animate-in slide-in-from-bottom duration-300 flex flex-col overflow-hidden">
                             <div className="flex items-center justify-center pt-3 pb-1" onClick={() => setIsMobileSettingsOpen(false)}>
                                <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
                             </div>
                             <div className="flex-1 overflow-hidden h-full">
                                 <Sidebar 
                                    settings={settings} 
                                    updateSettings={handleSettingsUpdate} 
                                    isPro={isPro}
                                    onShowPaywall={() => setShowPaywall(true)}
                                    onShowSecurity={() => setShowSecurity(true)}
                                    // State Machine Props
                                    onProcess={() => {
                                        setIsMobileSettingsOpen(false); // Close drawer to show process
                                        processBatch();
                                    }}
                                    isProcessing={isProcessing}
                                    isDirty={isDirty}
                                    hasImages={hasImages}
                                    isCompleted={isCompleted}
                                />
                             </div>
                        </div>
                    </div>
                )}
            </div>
        )}
      </div>

      {selectedImage && <PreviewPanel image={selectedImage} settings={settings} onClose={() => setSelectedImage(null)} />}
      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} />}
      {showSecurity && <SecurityModal onClose={() => setShowSecurity(false)} />}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      
      {/* Floating Selection Bar */}
      {selectionCount > 0 && (
            <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom duration-300">
                <div className="bg-ink-main text-white backdrop-blur-xl border border-white/10 rounded-full p-2 px-6 shadow-float flex items-center gap-4">
                    <span className="text-xs font-bold px-2 whitespace-nowrap">{selectionCount} selected</span>
                    <div className="h-6 w-px bg-white/20"></div>
                    <Button variant="secondary" onClick={handleRemoveSelected} className="text-xs h-8 border-transparent shadow-none hover:shadow-none hover:bg-white/10 text-white rounded-full px-4 bg-transparent">
                        <Trash2 className="w-3 h-3 mr-2" />
                        Remove
                    </Button>
                    <button onClick={() => setSelectedIds(new Set())} className="p-1 hover:bg-white/10 rounded-full">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
      )}
    </div>
  );
};