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
import { FeaturesGallery } from '../components/FeaturesGallery';
import { DEFAULT_SETTINGS, MAX_FREE_FILES } from '../constants';
import { ImageFile, ImageStatus, AppSettings } from '../types';
import { processImage } from '../services/imageProcessor';
import { normalizeImageFile } from '../utils/imageUtils';
import { Download, Eraser, Trash2, Lock, X, Settings2, Package, RefreshCw, Play, Check, Plus, Star } from 'lucide-react';
import { useStore } from '../store/useStore';
import JSZip from 'jszip';


const generateId = () => Math.random().toString(36).substring(2, 15);

// Professional Reviews Data
const REVIEWS = [
    { name: "Elara Vance", role: "Etsy Jewelry Shop Owner", text: "I convert hundreds of iPhone HEIC photos to JPG and resize them for my shop listings in one go. It handles the formats perfectly.", img: "/avatars/avatar_elara.png", rating: 5.0 },
    { name: "Kaelen Thorne", role: "ML Engineer @ TechStart", text: "Zero server uploads. That's the only way I can legally preprocess 5,000 sensitive dataset images. Local processing is a non-negotiable feature.", img: "/avatars/avatar_kaelen.png", rating: 5.0 },
    { name: "Marisol Vega", role: "Digital Artist", text: "Bulk watermarking used to be tedious. Now I apply my signature logic to 50+ artworks instantly before posting to social media.", img: "/avatars/avatar_marisol.png", rating: 4.8 },
    { name: "Brynn Harper", role: "Web Content Manager", text: "Most batch tools look like ancient software. This interface is clean, modern, and actually intuitive. It makes mundane tasks feel premium.", img: "/avatars/avatar_brynn.png", rating: 4.9 },
    { name: "Dr. Silas Mercer", role: "Archivist", text: "Pattern renaming saved me. Changing '{IMG_001}' to '{Site_Date_ID}' across thousands of field photos kept my database organized.", img: "/avatars/avatar_silas.png", rating: 4.9 },
    { name: "Oren Pikes", role: "SaaS Founder", text: "It's just fast. I threw 3GB of assets at it to test the browser engine, and it chewed through them without lagging. Solid engineering.", img: "/avatars/avatar_oren.png", rating: 5.0 },
    { name: "Jaxon Kade", role: "Wedding Photographer", text: "I use the Batch Watermark feature to proof 800+ wedding shots with my logo before sending to clients. Much faster than opening Lightroom.", img: "/avatars/avatar_jaxon.png", rating: 4.7 },
];

const HomeReviews = () => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % REVIEWS.length);
        }, 5000); // Faster swap for better engagement
        return () => clearInterval(timer);
    }, []);

    const review = REVIEWS[index];

    return (
        <div className="w-full max-w-[480px] mx-auto mt-6 mb-12 flex flex-col items-center gap-2 relative z-0">
            {/* Trust Header */}
            <div className="flex items-center justify-center gap-4 opacity-60 w-full mb-2">
                <div className="h-[1px] w-6 bg-ink-muted"></div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted whitespace-nowrap">
                    Trusted by Creators
                </p>
                <div className="h-[1px] w-6 bg-ink-muted"></div>
            </div>

            {/* Universal Auto-Swiping Card (Mobile & Desktop) */}
            <div className="w-full relative perspective-1000">
                {/* Stack Effect: Next Card Peeking Behind - Reduced Size */}
                <div className="absolute top-0 w-full h-full bg-[#1a1a1ae6]/40 backdrop-blur-sm rounded-3xl border border-white/5 transform translate-x-2 translate-y-2 -rotate-2 z-0 scale-[0.92] origin-center shadow-lg transition-transform duration-500"></div>
                <div className="absolute top-0 w-full h-full bg-[#1a1a1ae6]/20 backdrop-blur-sm rounded-3xl border border-white/5 transform translate-x-4 translate-y-4 -rotate-3 z-[-1] scale-[0.85] origin-center shadow-md transition-transform duration-500"></div>

                <div
                    key={index}
                    className="relative z-10 bg-[#1a1a1ae6] backdrop-blur-md p-4 rounded-3xl shadow-2xl border border-white/10 flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-500 fill-mode-forwards text-center min-h-[120px]"
                >
                    {/* 1. Stars at Top */}
                    <div className="flex gap-1 justify-center items-center">
                        <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(star => (
                                <Star
                                    key={star}
                                    size={13}
                                    className={`${star <= Math.round(review.rating) ? "text-white fill-current" : "text-white/30"} drop-shadow-md`}
                                />
                            ))}
                        </div>
                        <span className="text-[10px] font-bold text-white/60 ml-1.5">({review.rating})</span>
                    </div>

                    {/* 2. Review Text */}
                    <p className="text-[12px] text-white/95 leading-relaxed font-medium tracking-wide px-1">
                        "{review.text}"
                    </p>

                    {/* 3. User Profile at Bottom (No irregular gap) */}
                    <div className="flex items-center justify-center gap-3 text-left pt-1 mt-auto">
                        <img
                            src={review.img}
                            alt={review.name}
                            className="w-7 h-7 rounded-full object-cover shadow-sm ring-2 ring-white/10"
                        />
                        <div>
                            <h3 className="font-bold text-white text-[11px] leading-tight">{review.name}</h3>
                            <p className="text-[9px] text-white/50 uppercase tracking-widest font-semibold">{review.role}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress Lines Below Card (Now in normal flow, visible everywhere) */}
            <div className="flex justify-center gap-2 w-full mt-4">
                {REVIEWS.map((_, i) => (
                    <div
                        key={i}
                        className={`h-1.5 rounded-full transition-all duration-500 ${i === index ? 'w-8 bg-ink-main' : 'w-2 bg-ink-muted/30'}`}
                    />
                ))}
            </div>
        </div>
    );
};

// Re-implemented Marquee Component
const Ticker = () => (
    <div className="fixed bottom-0 w-full h-10 bg-white/80 backdrop-blur-md border-t border-ink-muted/10 flex items-center overflow-hidden z-50 pointer-events-none">
        <div className="animate-scroll whitespace-nowrap flex gap-16 text-[11px] font-medium tracking-[0.2em] text-ink-muted uppercase">
            <span>No Servers</span>
            <span>Local Processing</span>
            <span>HEIC Support</span>
            <span>100% Privacy</span>
            <span>Client-Side</span>
            <span>No Uploads</span>
            <span>Super Fast</span>
            <span>No Servers</span>
            <span>Local Processing</span>
            <span>HEIC Support</span>
            <span>100% Privacy</span>
            <span>Client-Side</span>
            <span>No Uploads</span>
            <span>Super Fast</span>
        </div>
    </div>
);

export const Home: React.FC = () => {
    const { user, isPro } = useStore();
    const [images, setImages] = useState<ImageFile[]>([]);
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [selectedImage, setSelectedImage] = useState<ImageFile | null>(null);
    const [previewMode, setPreviewMode] = useState<'general' | 'placement'>('general');
    const [activeSidebarView, setActiveSidebarView] = useState('main');
    const [settingsSnapshot, setSettingsSnapshot] = useState<AppSettings>(DEFAULT_SETTINGS);

    // State Machine Logic
    const [isProcessing, setIsProcessing] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const [isDirty, setIsDirty] = useState(false); // True if settings changed AFTER processing

    const [showPaywall, setShowPaywall] = useState(false);
    const [showSecurity, setShowSecurity] = useState(false);
    const [showLogin, setShowLogin] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const shouldShowLivePreview = images.length > 0 && ['watermark', 'signature'].includes(activeSidebarView);

    const handleSidebarViewChange = useCallback((view: string) => {
        // When entering a specific editing mode from main, save snapshot
        if (view !== 'main' && activeSidebarView === 'main') {
            setSettingsSnapshot(JSON.parse(JSON.stringify(settings)));
        }

        setActiveSidebarView(view);
        // If returning to main menu, close any active preview
        if (view === 'main') {
            setSelectedImage(null);
        }
    }, [setActiveSidebarView, setSelectedImage, settings, activeSidebarView]);

    const handleSaveChanges = () => {
        // Changes are already in 'settings' state, just exit
        handleSidebarViewChange('main');
    };

    const handleDiscardChanges = () => {
        // Revert to snapshot
        setSettings(settingsSnapshot);
        handleSidebarViewChange('main');
    };

    useEffect(() => {
        if (shouldShowLivePreview && !selectedImage && images.length > 0) {
            setSelectedImage(images[0]);
        }
    }, [shouldShowLivePreview, selectedImage, images]);

    const getSelectedImageIndex = () => {
        if (!selectedImage) return -1;
        return images.findIndex(img => img.id === selectedImage.id);
    };

    const handleNextImage = () => {
        const idx = getSelectedImageIndex();
        if (idx !== -1 && idx < images.length - 1) {
            setSelectedImage(images[idx + 1]);
        }
    };

    const handlePrevImage = () => {
        const idx = getSelectedImageIndex();
        if (idx > 0) {
            setSelectedImage(images[idx - 1]);
        }
    };
    const [isMobileSettingsOpen, setIsMobileSettingsOpen] = useState(false);

    const fabInputRef = useRef<HTMLInputElement>(null);

    // Listen for 'open-preview' event from SignatureModule
    useEffect(() => {
        const handleOpenPreview = () => {
            if (images.length > 0) {
                setPreviewMode('general'); // Default to general preview
                setSelectedImage(images[0]);
            } else {
                // Optional: Show toast "Add an image first"
                alert("Please add an image first.");
            }
        };
        window.addEventListener('open-preview', handleOpenPreview);
        return () => window.removeEventListener('open-preview', handleOpenPreview);
    }, [images]);

    // Listen for Tally Submission to disable future popups
    useEffect(() => {
        const handleTallyEvent = (e: MessageEvent) => {
            if (e.data && typeof e.data === 'string' && e.data.includes('Tally.FormSubmitted')) {
                console.log("User submitted feedback! Disabling future popups.");
                localStorage.setItem('batchblitz_has_voted', 'true');
            }
            // Tally sometimes sends objects
            if (e.data && e.data.event === 'Tally.FormSubmitted') {
                console.log("User submitted feedback! Disabling future popups.");
                localStorage.setItem('batchblitz_has_voted', 'true');
            }
        };
        window.addEventListener('message', handleTallyEvent);
        return () => window.removeEventListener('message', handleTallyEvent);
    }, []);

    // Load Tally Script on Mount
    useEffect(() => {
        const scriptId = 'tally-embed-script';
        if (!document.getElementById(scriptId)) {
            const script = document.createElement('script');
            script.id = scriptId;
            script.src = "https://tally.so/widgets/embed.js";
            script.async = true;
            script.onload = () => console.log("Tally Script Loaded");
            script.onerror = (e) => console.error("Tally Script Failed", e);
            document.head.appendChild(script);
        }
    }, []);


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

                // Extract dimensions
                const dimensions = await new Promise<{ width: number, height: number }>((resolve) => {
                    const img = new Image();
                    img.onload = () => resolve({ width: img.width, height: img.height });
                    img.onerror = () => resolve({ width: 0, height: 0 });
                    img.src = URL.createObjectURL(normalized);
                });

                return {
                    id: generateId(),
                    file: normalized,
                    path: path, // Store the folder structure
                    previewUrl: URL.createObjectURL(normalized),
                    status: ImageStatus.IDLE,
                    originalDimensions: dimensions
                };
            })
        );

        setImages(prev => {
            // --- Signature Enforcement ---
            // If in Single Sign Mode, enforce 1 file limit
            if (settings.signature.enabled && settings.signature.mode === 'single') {
                if (prev.length > 0) {
                    alert("Single Signature Mode allows only one image. Please switch to Batch mode to process multiple.");
                    return prev; // Reject new
                }
                if (normalizedFiles.length > 1) {
                    alert("Single Signature Mode allows only one image. Only the first one was added.");
                    return [normalizedFiles[0]];
                }
            }
            // -----------------------------

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
        setImages(prev => prev.map(img => ({ ...img, status: ImageStatus.PROCESSING })));

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






        // --- SMART TALLY FEEDBACK LOGIC ---
        console.log("Batch complete. Checking Tally Logic...");

        // 1. Check if user already voted
        const hasVoted = localStorage.getItem('batchblitz_has_voted') === 'true';
        if (hasVoted) {
            console.log("User already voted. Skipping feedback.");
            return;
        }

        // 2. Increment Batch Count
        const currentBatchCount = parseInt(localStorage.getItem('batchblitz_batch_count') || '0', 10) + 1;
        localStorage.setItem('batchblitz_batch_count', currentBatchCount.toString());

        // 3. Check Milestone (1st, 10th, 50th, 100th)
        const FEEDBACK_MILESTONES = [1, 10, 50, 100];

        if (FEEDBACK_MILESTONES.includes(currentBatchCount)) {
            console.log(`Milestone reached (${currentBatchCount}). Triggering Tally...`);

            const openTally = () => {
                // @ts-ignore
                if (window.Tally) {
                    // @ts-ignore
                    window.Tally.openPopup('5B4ObE', {
                        layout: 'modal',
                        width: 400,
                        emoji: { text: '👋', animation: 'wave' },
                        autoClose: 2000,
                        hiddenFields: {
                            processed_count: images ? images.length : 0,
                            plan: isPro ? 'Pro' : 'Free',
                            user_id: user ? user.id : 'anonymous',
                            batch_milestone: currentBatchCount
                        }
                    });
                }
            };

            const scriptSrc = "https://tally.so/widgets/embed.js";
            if (!document.querySelector(`script[src="${scriptSrc}"]`)) {
                const script = document.createElement('script');
                script.src = scriptSrc;
                script.async = true;
                script.onload = () => setTimeout(openTally, 500);
                document.head.appendChild(script);
            } else {
                setTimeout(openTally, 1000);
            }
        } else {
            console.log(`Batch ${currentBatchCount} is not a feedback milestone. Skipping.`);
        }
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
                // Native download to fix filename issues
                const url = URL.createObjectURL(content);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'BatchBlitz_Export.zip';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
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
        <div className="flex flex-col h-screen w-full text-ink-main font-sans relative bg-paper-base bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] overflow-hidden">
            <Navbar
                onLoginClick={() => setShowLogin(true)}
                onReset={() => handleClearAll()}
                hasImages={hasImages}
            />

            {/* Ticker - Only visible when NO images */}
            {!hasImages && <Ticker />}



            {/* Add More FAB */}
            {hasImages && (
                <>
                    {/* Locked State Warning for Single Sign Mode */}
                    {settings.signature.enabled && settings.signature.mode === 'single' ? (
                        <div className="fixed bottom-8 left-8 z-50 group">
                            <button
                                disabled
                                className="w-14 h-14 bg-gray-200 text-gray-400 rounded-full shadow-lg flex items-center justify-center cursor-not-allowed border-2 border-transparent"
                            >
                                <Lock size={24} />
                            </button>
                            <div className="absolute left-16 bottom-2 bg-black/80 text-white text-[10px] font-bold px-3 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none animate-in slide-in-from-left-2">
                                Single Mode Active
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={handleFabClick}
                            className="fixed bottom-8 left-8 w-14 h-14 bg-black text-white rounded-full shadow-xl flex items-center justify-center z-50 hover:scale-110 active:scale-95 transition-all animate-in zoom-in duration-300"
                            title="Add More Images"
                        >
                            <Plus size={32} strokeWidth={2.5} />
                        </button>
                    )}

                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        ref={fabInputRef}
                        onChange={handleFabChange}
                        disabled={settings.signature.enabled && settings.signature.mode === 'single'}
                    />
                </>
            )}

            <div
                className="flex-1 relative flex flex-col overflow-y-auto overflow-x-hidden pt-16 md:pt-0 no-scrollbar-gutter scroll-smooth"
                id="editor"
            >

                {/* Empty State */}
                {!hasImages && (
                    <div className="flex-1 flex flex-col items-center justify-center md:justify-start md:pt-24 p-6 z-20 w-full max-w-4xl mx-auto">
                        <Dropzone onFilesDropped={(files) => {
                            // Double check enforcement
                            if (settings.signature.enabled && settings.signature.mode === 'single' && files.length > 1) {
                                alert("Single Signature Mode allows only one image.");
                                handleFilesDropped([files[0]]);
                            } else {
                                handleFilesDropped(files);
                            }
                        }} />

                        {/* Auto Sliding Reviews */}
                        <HomeReviews />

                        {/* Features Gallery */}
                        <FeaturesGallery />
                    </div>
                )}

                {/* Studio Workspace */}
                {hasImages && (
                    <div className="flex w-full h-full relative pb-20 md:pb-0 md:pt-20">

                        {/* Main Canvas Area */}
                        <div className="flex-1 h-full overflow-hidden relative flex flex-col">

                            {/* Image Grid OR Live Preview */}
                            {shouldShowLivePreview && selectedImage ? (
                                <div className="flex-1 w-full h-full relative border-r border-ink-muted/10 bg-paper-base">
                                    <PreviewPanel
                                        image={selectedImage}
                                        settings={settings}
                                        updateSettings={setSettings}
                                        onClose={() => handleSidebarViewChange('main')}
                                        onSave={handleSaveChanges}
                                        onCancel={handleDiscardChanges}
                                        mode={activeSidebarView === 'signature' ? 'placement' : 'general'}
                                        inline={true}
                                        onNext={handleNextImage}
                                        onPrev={handlePrevImage}
                                        hasPrev={getSelectedImageIndex() > 0}
                                        hasNext={getSelectedImageIndex() < images.length - 1}
                                    />
                                </div>
                            ) : (
                                /* Image Grid Scroll Area */
                                <div className="flex-1 overflow-y-auto overflow-x-hidden p-0 pt-4 no-scrollbar pb-32">
                                    <ImageGrid
                                        images={images}
                                        onRemove={handleRemoveImage}
                                        onSelect={(img) => {
                                            setPreviewMode('general');
                                            setSelectedImage(img);
                                        }}
                                        selectedIds={selectedIds}
                                        onToggleSelection={handleToggleSelection}
                                    />
                                </div>
                            )}

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
                        <div className="hidden md:flex flex-none min-w-[370px] h-full relative z-20 pr-2">
                            <Sidebar
                                settings={settings}
                                updateSettings={handleSettingsUpdate}
                                isPro={isPro}
                                onShowPaywall={() => setShowPaywall(true)}
                                onShowSecurity={() => setShowSecurity(true)}
                                onPlacementStart={() => {
                                    if (images.length > 0) {
                                        setPreviewMode('placement');
                                        setSelectedImage(images[0]);
                                    }
                                }}
                                // State Machine Props
                                onActiveViewChange={handleSidebarViewChange}
                                activeView={activeSidebarView}
                                onProcess={processBatch}
                                isProcessing={isProcessing}
                                isDirty={isDirty}
                                hasImages={hasImages}
                                isCompleted={isCompleted}
                            />
                        </div>

                        {/* Mobile Add More FAB (Above Dock) */}
                        {/* Mobile Add More FAB (Above Dock) */}
                        <input
                            type="file"
                            multiple
                            className="hidden"
                            ref={fabInputRef}
                            onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                    handleFilesDropped(Array.from(e.target.files));
                                }
                            }}
                        />
                        <div className="md:hidden fixed bottom-[118px] right-4 z-[60] animate-in slide-in-from-bottom-2">
                            <button
                                onClick={() => fabInputRef.current?.click()}
                                className="w-14 h-14 bg-black text-white rounded-full shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
                            >
                                <Plus size={24} strokeWidth={3} />
                            </button>
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

                                            onPlacementStart={() => {
                                                setIsMobileSettingsOpen(false);
                                                if (images.length > 0) {
                                                    setPreviewMode('placement');
                                                    setSelectedImage(images[0]);
                                                }
                                            }}
                                            // State Machine Props
                                            onActiveViewChange={handleSidebarViewChange}
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

            {selectedImage && !shouldShowLivePreview && (
                <PreviewPanel
                    image={selectedImage}
                    settings={settings}
                    updateSettings={setSettings}
                    onClose={() => setSelectedImage(null)}
                    mode={previewMode}
                    onNext={handleNextImage}
                    onPrev={handlePrevImage}
                    hasPrev={getSelectedImageIndex() > 0}
                    hasNext={getSelectedImageIndex() < images.length - 1}
                />
            )}
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

export default Home;