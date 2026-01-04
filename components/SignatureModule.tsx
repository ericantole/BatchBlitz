import React, { useRef, useState, useEffect } from 'react';
import { PenTool, Upload, MousePointer2, Layers, AlertCircle, X, Check, Move } from 'lucide-react';
import { AppSettings } from '../types';
import { InfoTooltip } from './InfoTooltip';

interface SignatureModuleProps {
    settings: AppSettings;
    updateSettings: (newSettings: AppSettings) => void;
    isPro: boolean;
    onShowPaywall: () => void;
    onPlacementStart?: () => void;
}

export const SignatureModule: React.FC<SignatureModuleProps> = ({
    settings,
    updateSettings,
    isPro,
    onShowPaywall,
    onPlacementStart
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    // Canvas dimensions
    const WIDTH = 400;
    const HEIGHT = 200;

    const handleSignatureChange = (key: keyof typeof settings.signature, value: any) => {
        updateSettings({
            ...settings,
            signature: {
                ...settings.signature,
                [key]: value
            }
        });
    };

    // Helper to update image AND reset position
    const updateSignatureImage = (dataUrl: string | null) => {
        updateSettings({
            ...settings,
            signature: {
                ...settings.signature,
                imageData: dataUrl,
                position: { x: 50, y: 50 } // Always reset to center on new input
            }
        });
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                updateSignatureImage(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // --- Drawing Logic ---
    useEffect(() => {
        if (settings.signature.inputMode === 'draw' && !settings.signature.imageData) {
            clearCanvas();
        }
    }, [settings.signature.inputMode]);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const x = (('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left) * scaleX;
        const y = (('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top) * scaleY;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#000';
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const x = (('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left) * scaleX;
        const y = (('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top) * scaleY;

        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        if (isDrawing) {
            setIsDrawing(false);
            saveCanvas();
        }
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, WIDTH, HEIGHT);
        // Force reset
        updateSignatureImage(null);
    };

    const saveCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const dataUrl = canvas.toDataURL('image/png');
            // We use the helper to ensuring centering
            updateSignatureImage(dataUrl);
        }
    };

    return (
        <div className="space-y-4">
            {/* Header Toggle */}
            <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-ink-main font-bold">Enable Signature</span>
                    <InfoTooltip content={`**Add your signature.**\n\n**Single Mode:** Signature applies to current image only.\n**Batch Mode:** Signature placement applies to ALL images.`} />
                </div>
                {/* Apple Toggle */}
                <button
                    onClick={() => handleSignatureChange('enabled', !settings.signature.enabled)}
                    className={`w-10 h-6 rounded-full relative transition-colors duration-200 ease-in-out focus:outline-none ${settings.signature.enabled ? 'bg-apple-green' : 'bg-gray-200'}`}
                >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${settings.signature.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
            </div>

            {settings.signature.enabled && (
                <div className="space-y-4 animate-in slide-in-from-top-1 duration-200">

                    {/* Mode Selection */}
                    <div className="bg-white p-1 rounded-lg border border-gray-100 flex">
                        <button
                            onClick={() => handleSignatureChange('mode', 'single')}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-md flex items-center justify-center gap-1.5 transition-all
                                ${settings.signature.mode === 'single' ? 'bg-ink-main text-white shadow-sm' : 'text-ink-muted hover:text-ink-main'}
                            `}
                        >
                            <MousePointer2 size={12} />
                            Single (Drag)
                        </button>
                        <button
                            onClick={() => handleSignatureChange('mode', 'batch')}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-md flex items-center justify-center gap-1.5 transition-all
                                ${settings.signature.mode === 'batch' ? 'bg-ink-main text-white shadow-sm' : 'text-ink-muted hover:text-ink-main'}
                            `}
                        >
                            <Layers size={12} />
                            Batch (%)
                        </button>
                    </div>

                    {settings.signature.mode === 'single' && (
                        <div className="bg-blue-50 text-blue-700 text-[10px] p-2 rounded-md flex items-start gap-2">
                            <AlertCircle size={12} className="mt-0.5 shrink-0" />
                            <span>Only 1 file allowed in Single Mode. Extra files will be ignored.</span>
                        </div>
                    )}

                    {/* Input Method */}
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => handleSignatureChange('inputMode', 'draw')}
                            className={`flex-1 text-xs py-2 font-bold rounded-md transition-all ${settings.signature.inputMode === 'draw' ? 'bg-white text-ink-main shadow-sm' : 'text-ink-muted hover:text-ink-main'}`}
                        >
                            Draw
                        </button>
                        <button
                            onClick={() => handleSignatureChange('inputMode', 'upload')}
                            className={`flex-1 text-xs py-2 font-bold rounded-md transition-all ${settings.signature.inputMode === 'upload' ? 'bg-white text-ink-main shadow-sm' : 'text-ink-muted hover:text-ink-main'}`}
                        >
                            Upload
                        </button>
                    </div>

                    {/* Input Area */}
                    {settings.signature.inputMode === 'draw' ? (
                        <div className="relative border border-gray-200 rounded-lg bg-white overflow-hidden shadow-inner group">
                            <canvas
                                ref={canvasRef}
                                width={WIDTH}
                                height={HEIGHT}
                                className="w-full h-32 touch-none cursor-crosshair"
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                                onTouchStart={startDrawing}
                                onTouchMove={draw}
                                onTouchEnd={stopDrawing}
                            />
                            <button
                                onClick={clearCanvas}
                                className="absolute bottom-2 right-2 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-[10px] text-ink-muted font-bold uppercase rounded hover:text-ink-main transition-colors border border-transparent hover:border-gray-300"
                            >
                                Clear
                            </button>
                            <label className="absolute top-2 left-2 text-[10px] text-gray-400 pointer-events-none select-none font-medium opacity-50">
                                Sign Here
                            </label>
                        </div>
                    ) : (
                        <label className={`
                            flex flex-col items-center justify-center w-full h-32 border border-dashed rounded-lg cursor-pointer bg-white transition-colors
                            border-gray-300 hover:bg-gray-50
                        `}>
                            {settings.signature.imageData ? (
                                <img src={settings.signature.imageData} alt="Signature" className="h-full object-contain p-4" />
                            ) : (
                                <div className="flex flex-col items-center justify-center pt-2 pb-3">
                                    <Upload className="w-6 h-6 text-gray-400 mb-2" />
                                    <p className="text-xs text-ink-muted font-bold">Upload PNG</p>
                                    <p className="text-[10px] text-gray-400 mt-1">Transparent background recommended</p>
                                </div>
                            )}
                            <input type="file" className="hidden" accept="image/png" onChange={handleImageUpload} />
                        </label>
                    )}

                    {/* Visual Scale Slider (1-100) */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold text-ink-muted uppercase">
                            <div className="flex items-center">
                                <span>Scale</span>
                                <InfoTooltip content="Resize signature relative to image width." />
                            </div>
                            <span className="text-ink-main">{settings.signature.scale}%</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="100"
                            step="1"
                            value={settings.signature.scale}
                            onChange={(e) => handleSignatureChange('scale', parseInt(e.target.value))}
                            className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer focus:outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-ink-main"
                        />
                    </div>


                </div>
            )}
        </div>
    );
};
