import React, { useState, useCallback, useEffect } from 'react';
import { Dropzone } from './components/Dropzone';
import { Sidebar } from './components/Sidebar';
import { ImageGrid } from './components/ImageGrid';
import { Button } from './components/Button';
import { PreviewPanel } from './components/PreviewPanel';
import { PaywallModal } from './components/PaywallModal';
import { SecurityModal } from './components/SecurityModal';
import { LoginModal } from './components/LoginModal';
import { DEFAULT_SETTINGS, MAX_FREE_FILES } from './constants';
import { ImageFile, ImageStatus, AppSettings } from './types';
import { processImage } from './services/imageProcessor';
import { normalizeImageFile } from './utils/imageUtils';
import { Download, Play, Eraser, Trash2, Lock, X, Settings2, LogOut } from 'lucide-react';
import { supabase } from './utils/supabase/client';
import { useStore } from './store/useStore';

const generateId = () => Math.random().toString(36).substring(2, 15);

// Ticker Component (Clean / Minimal)
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
            {/* Duplicate for seamless loop */}
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

const App: React.FC = () => {
  // Store
  const { user, isPro, setUser, setPro, reset: resetStore } = useStore();

  // Local State
  const [images, setImages] = useState<ImageFile[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [selectedImage, setSelectedImage] = useState<ImageFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isMobileSettingsOpen, setIsMobileSettingsOpen] = useState(false);

  // Auth Listener
  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (_event === 'SIGNED_OUT') {
          resetStore();
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, resetStore]);

  const handleSignOut = async () => {
      await supabase.auth.signOut();
      resetStore();
      // Optionally reset image state as well if needed
      // setImages([]); 
  };

  const handleFilesDropped = useCallback(async (files: File[]) => {
    const placeholders: ImageFile[] = files.map(file => ({
        id: generateId(),
        file: file, 
        previewUrl: '', // Temp
        status: ImageStatus.IDLE
    }));

    const normalizedFiles = await Promise.all(
        files.map(async (file) => {
             const normalized = await normalizeImageFile(file);
             return {
                 id: generateId(),
                 file: normalized,
                 previewUrl: URL.createObjectURL(normalized),
                 status: ImageStatus.IDLE
             };
        })
    );
    
    setImages(prev => {
        const combined = [...prev, ...normalizedFiles];
        // Only limit if not Pro
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
    images.forEach(img => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    setSelectedIds(new Set());
    setProgress(0);
    setIsProcessing(false);
  };

  const processBatch = async () => {
    setIsProcessing(true);
    setProgress(0);
    
    let currentImages = [...images];
    let completedCount = 0;

    setImages(prev => prev.map(img => ({...img, status: ImageStatus.PROCESSING })));

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
        
        completedCount++;
        setProgress(Math.round((completedCount / currentImages.length) * 100));
        await new Promise(r => setTimeout(r, 50)); 
    }

    setIsProcessing(false);
  };

  const downloadAll = () => {
    const completedImages = images.filter(img => img.status === ImageStatus.COMPLETED && img.processedUrl);
    if (completedImages.length === 0) return;

    let delay = 0;
    completedImages.forEach(img => {
        setTimeout(() => {
            const a = document.createElement('a');
            a.href = img.processedUrl!;
            const ext = settings.convert.format.split('/')[1];
            const name = img.file.name.substring(0, img.file.name.lastIndexOf('.')) || img.file.name;
            a.download = `${name}_batchblitz.${ext}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }, delay);
        delay += 300;
    });
  };

  const hasImages = images.length > 0;
  const isAllCompleted = images.length > 0 && images.every(img => img.status === ImageStatus.COMPLETED);
  const selectionCount = selectedIds.size;

  return (
    <div className="flex h-screen w-full text-ink-main overflow-hidden font-sans relative">
      
      {/* Background Ticker */}
      <Ticker />

      {/* Dev Mode Badge */}
      {isPro ? (
          <div className="fixed bottom-12 left-2 z-[100] bg-accent-gold/10 border border-accent-gold/20 backdrop-blur-md px-2 py-1 rounded text-[10px] text-accent-gold font-bold pointer-events-none flex items-center gap-1">
              <Lock size={10} /> PRO ENABLED
          </div>
      ) : (
          <div className="fixed bottom-12 left-2 z-[100] bg-red-500/10 border border-red-500/20 backdrop-blur-md px-2 py-1 rounded text-[10px] text-red-600 font-bold pointer-events-none">
              DEV MODE: Payments Disabled
          </div>
      )}

      {/* Hero / Empty State */}
      {!hasImages && (
        <div className="absolute inset-0 flex items-center justify-center p-6 z-20">
            <Dropzone onFilesDropped={handleFilesDropped} />
            {/* Top Right Login for Empty State */}
            <div className="absolute top-6 right-6">
                {!user ? (
                    <button 
                        onClick={() => setShowLogin(true)}
                        className="bg-white px-5 py-2 rounded-full shadow-card text-sm font-bold text-ink-main hover:bg-gray-50 transition-colors"
                    >
                        Sign In
                    </button>
                ) : (
                     <div className="flex items-center gap-3 bg-white pl-1 pr-4 py-1 rounded-full shadow-card">
                         {user.user_metadata?.avatar_url && (
                             <img src={user.user_metadata.avatar_url} alt="User" className="w-8 h-8 rounded-full border border-gray-200" />
                         )}
                         <div className="flex flex-col">
                             <span className="text-xs font-bold text-ink-main max-w-[100px] truncate">{user.user_metadata?.full_name || "User"}</span>
                             {isPro && <span className="text-[9px] text-accent-gold font-bold tracking-wider">PRO MEMBER</span>}
                         </div>
                          <button onClick={handleSignOut} className="text-ink-muted hover:text-red-500 transition-colors ml-2" title="Sign Out">
                             <LogOut size={14} />
                         </button>
                     </div>
                )}
            </div>
        </div>
      )}

      {/* Main App Layout */}
      {hasImages && (
        <>
            {/* Header (Minimal) */}
            <div className="absolute top-0 left-0 w-full h-20 flex items-center px-4 md:px-8 z-30 pointer-events-none">
                 <div className="bg-white/80 backdrop-blur-md px-5 py-2.5 rounded-2xl shadow-card border border-white flex items-center gap-4 pointer-events-auto group">
                    <div className="relative h-8 flex items-center justify-center px-2">
                         <div className="text-xl font-serif font-bold tracking-tight text-ink-main relative z-10 px-2">
                             BatchBlitz
                         </div>
                         <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 32" preserveAspectRatio="none">
                           <rect 
                             x="0" y="0" width="100%" height="100%" 
                             fill="none" 
                             stroke="#D4AF37" 
                             strokeWidth="1.5"
                             strokeLinecap="square"
                             className="animate-draw-rect"
                             rx="4"
                           />
                        </svg>
                    </div>
                 </div>
                 
                 {/* Navbar Actions */}
                 <div className="ml-auto pointer-events-auto flex items-center gap-4">
                     {!user ? (
                        <button 
                            onClick={() => setShowLogin(true)}
                            className="bg-white/80 backdrop-blur-md px-5 py-2.5 rounded-2xl shadow-card border border-white text-sm font-bold text-ink-main hover:bg-white transition-all hidden md:block"
                        >
                            Sign In
                        </button>
                     ) : (
                         <div className="bg-white/80 backdrop-blur-md pl-1.5 pr-4 py-1.5 rounded-2xl shadow-card border border-white flex items-center gap-3 hidden md:flex">
                             {user.user_metadata?.avatar_url ? (
                                 <img src={user.user_metadata.avatar_url} alt="User" className="w-8 h-8 rounded-full border border-gray-200" />
                             ) : (
                                 <div className="w-8 h-8 bg-accent-gold/20 rounded-full flex items-center justify-center text-xs font-bold text-accent-gold">
                                     {user.email?.charAt(0).toUpperCase()}
                                 </div>
                             )}
                             <div className="flex flex-col">
                                 <span className="text-xs font-bold text-ink-main max-w-[100px] truncate">{user.user_metadata?.full_name || "User"}</span>
                                 {isPro && <span className="text-[9px] text-accent-gold font-bold tracking-wider leading-none">PRO</span>}
                             </div>
                              <button onClick={handleSignOut} className="text-ink-muted hover:text-red-500 transition-colors ml-2" title="Sign Out">
                                 <LogOut size={16} />
                             </button>
                         </div>
                     )}
                    <Dropzone onFilesDropped={handleFilesDropped} compact />
                 </div>
            </div>

            {/* Sidebar (Desktop) */}
            <div className="hidden md:block absolute top-24 left-8 bottom-24 w-80 z-20 animate-in slide-in-from-left duration-500">
               <Sidebar 
                settings={settings} 
                updateSettings={setSettings} 
                isPro={isPro}
                onShowPaywall={() => setShowPaywall(true)}
                onShowSecurity={() => setShowSecurity(true)}
               />
            </div>

            {/* Mobile Settings FAB */}
            <div className="md:hidden fixed bottom-24 right-6 z-50">
                <button
                    onClick={() => setIsMobileSettingsOpen(true)}
                    className="w-14 h-14 bg-ink-main text-white rounded-full shadow-float flex items-center justify-center hover:scale-105 transition-transform"
                >
                    <Settings2 size={24} />
                </button>
            </div>

            {/* Mobile Settings Drawer (Bottom Sheet) */}
            {isMobileSettingsOpen && (
                <div className="fixed inset-0 z-[60] md:hidden">
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsMobileSettingsOpen(false)} />
                    <div className="absolute bottom-0 left-0 right-0 h-[80vh] bg-[#F9F9F7] rounded-t-3xl shadow-float animate-in slide-in-from-bottom duration-300 flex flex-col">
                         <div className="flex items-center justify-center pt-3 pb-1" onClick={() => setIsMobileSettingsOpen(false)}>
                            <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
                         </div>
                         <div className="flex-1 overflow-hidden p-4">
                             <Sidebar 
                                settings={settings} 
                                updateSettings={setSettings} 
                                isPro={isPro}
                                onShowPaywall={() => setShowPaywall(true)}
                                onShowSecurity={() => setShowSecurity(true)}
                            />
                         </div>
                    </div>
                </div>
            )}

            {/* Main Grid Area */}
            <div className="absolute top-24 left-4 right-4 md:left-[380px] md:right-8 bottom-0 overflow-y-auto custom-scrollbar z-10 pb-32 md:pb-20">
                <div className="mb-24">
                    <ImageGrid 
                        images={images} 
                        onRemove={handleRemoveImage} 
                        onSelect={setSelectedImage}
                        selectedIds={selectedIds}
                        onToggleSelection={handleToggleSelection}
                    />
                </div>
            </div>

            {/* Floating Dock (Action Bar) */}
            <div className="fixed bottom-6 md:bottom-12 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom duration-500 w-[90%] md:w-auto max-w-lg">
                {selectionCount > 0 ? (
                    // Selection Mode Dock
                     <div className="bg-ink-main text-white backdrop-blur-xl border border-white/10 rounded-full p-2 px-6 shadow-float flex items-center justify-between gap-4 w-full md:w-auto">
                        <span className="text-xs font-bold px-2 whitespace-nowrap">{selectionCount} selected</span>
                        <div className="h-6 w-px bg-white/20 hidden md:block"></div>
                        
                        <div className="flex items-center gap-2">
                            <Button variant="secondary" onClick={handleRemoveSelected} className="text-xs h-8 border-transparent shadow-none hover:shadow-none hover:bg-white/10 text-white rounded-full px-4 bg-transparent">
                                <Trash2 className="w-3 h-3 mr-2" />
                                <span className="hidden sm:inline">Remove</span>
                            </Button>
                            
                            <Button onClick={() => setShowPaywall(true)} className="text-xs h-8 border-transparent shadow-none hover:shadow-none bg-accent-gold text-white rounded-full px-4 whitespace-nowrap">
                                <Lock className="w-3 h-3 mr-2" />
                                <span className="hidden sm:inline">Export</span> Selected
                            </Button>
                             <button 
                                onClick={() => setSelectedIds(new Set())}
                                className="p-1 hover:bg-white/10 rounded-full"
                             >
                                <X className="w-4 h-4" />
                             </button>
                        </div>
                    </div>
                ) : (
                    // Standard Dock
                    <div className="bg-white/90 backdrop-blur-xl border border-white rounded-full p-2 px-6 shadow-float flex items-center justify-between gap-4 md:gap-6 w-full md:w-auto">
                         <Button variant="secondary" onClick={handleClearAll} disabled={isProcessing} className="text-xs h-10 border-transparent shadow-none hover:shadow-none hover:bg-black/5 rounded-full px-4 min-w-[80px]">
                            <Eraser className="w-4 h-4 mr-2 text-ink-muted" />
                            <span className="text-ink-muted">Clear</span>
                        </Button>
    
                        <div className="h-8 w-px bg-ink-muted/10 hidden md:block"></div>
    
                        {isProcessing ? (
                             <div className="flex flex-col gap-2 w-full md:w-48 px-2">
                                <div className="flex justify-between text-[10px] text-ink-muted font-medium tracking-wide">
                                    <span>PROCESSING</span>
                                    <span>{progress}%</span>
                                </div>
                                <div className="h-1.5 bg-paper-dark rounded-full overflow-hidden shadow-pressed">
                                    <div 
                                        className="h-full bg-accent-gold transition-all duration-300 rounded-full"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        ) : (
                             !isAllCompleted ? (
                                <Button 
                                    onClick={processBatch} 
                                    variant="primary"
                                    size="lg"
                                    className="flex-1 md:flex-none px-6 md:px-8 rounded-full shadow-lg whitespace-nowrap"
                                >
                                    <Play className="w-4 h-4 mr-2 fill-current" />
                                    Start Batch
                                </Button>
                            ) : (
                                <Button 
                                    onClick={downloadAll} 
                                    variant="neon"
                                    size="lg"
                                    className="flex-1 md:flex-none px-6 md:px-8 rounded-full shadow-lg bg-green-600 text-white hover:bg-green-700 whitespace-nowrap"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Download Zip
                                </Button>
                            )
                        )}
                    </div>
                )}
            </div>
        </>
      )}

      {/* Slide-out Panel */}
      {selectedImage && (
        <PreviewPanel 
            image={selectedImage} 
            settings={settings} 
            onClose={() => setSelectedImage(null)} 
        />
      )}

      {/* Paywall Modal */}
      {showPaywall && (
        <PaywallModal onClose={() => setShowPaywall(false)} />
      )}
      
      {/* Security Modal */}
      {showSecurity && (
        <SecurityModal onClose={() => setShowSecurity(false)} />
      )}

      {/* Login Modal */}
      {showLogin && (
          <LoginModal onClose={() => setShowLogin(false)} />
      )}
    </div>
  );
};

export default App;