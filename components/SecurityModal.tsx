import React from 'react';
import { X, ShieldCheck, Cpu, WifiOff } from 'lucide-react';

interface SecurityModalProps {
    onClose: () => void;
}

export const SecurityModal: React.FC<SecurityModalProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-white/80 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            <div className="relative w-full max-w-lg bg-paper-base rounded-2xl shadow-float overflow-hidden animate-in zoom-in-95 duration-300 border border-white">
                <div className="p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold tracking-tight text-ink-main flex items-center gap-2">
                            <ShieldCheck className="text-apple-green" />
                            Security Architecture
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-black/5 rounded-full transition-colors text-ink-muted hover:text-ink-main"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <p className="text-ink-main/80 leading-relaxed">
                        BatchBlitz operates on a <strong>Zero-Trust Client-Side Engine</strong>. Unlike other tools, we do not have a backend server for image processing.
                    </p>

                    <div className="grid gap-4">
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4">
                            <div className="bg-paper-dark p-3 rounded-lg h-fit text-ink-main">
                                <Cpu size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-ink-main text-sm uppercase tracking-wide">Wasm Sandbox</h3>
                                <p className="text-sm text-ink-muted mt-1">
                                    Your images are processed using a WebAssembly sandbox isolated within your browser's memory. The data never leaves this sandbox.
                                </p>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4">
                            <div className="bg-paper-dark p-3 rounded-lg h-fit text-ink-main">
                                <WifiOff size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-ink-main text-sm uppercase tracking-wide">Local Processing</h3>
                                <p className="text-sm text-ink-muted mt-1">
                                    Your images never leave your device. Pro features require a brief internet check for license verification, but all processing happens locally.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="text-xs text-center text-ink-muted pt-4 border-t border-gray-100">
                        Proprietary Client-Side Engine v2.1.0 • Build 8923
                    </div>
                </div>
            </div>
        </div>
    );
};