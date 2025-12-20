import React from 'react';
import { X, Zap, Infinity, Lock, Shield, Check } from 'lucide-react';
import { Button } from './Button';
import { useStore } from '../store/useStore';

interface PaywallModalProps {
    onClose: () => void;
}

import { useNavigate } from 'react-router-dom';
import { useToast } from './Toast';

export const PaywallModal: React.FC<PaywallModalProps> = ({ onClose }) => {
    const { setPro, user } = useStore();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const handleDevUpgrade = () => {
        if (!user) {
            onClose();
            navigate('/login?next=/checkout&reason=upgrade');
            return;
        }
        // DEV MODE: Bypass Payment Gateway
        console.log('DEV MODE: Premium Activated');
        setPro(true);
        showToast("DEV MODE: Premium Activated!", "success");
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-500"
                onClick={onClose}
            />

            {/* Black Card Design */}
            <div className="relative w-full max-w-md bg-gradient-to-br from-[#1c1c1e] to-[#000000] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/10 text-white">

                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-accent-gold/20 blur-[100px] rounded-full pointer-events-none translate-x-1/3 -translate-y-1/3"></div>

                <div className="relative p-8 space-y-8">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
                    >
                        <X size={20} strokeWidth={1.5} />
                    </button>

                    <div className="text-center space-y-4 pt-2">
                        <div className="w-16 h-16 mx-auto bg-accent-gold rounded-2xl flex items-center justify-center shadow-lg shadow-accent-gold/20 mb-2">
                            <Zap className="w-8 h-8 text-white fill-white" />
                        </div>
                        <h2 className="text-3xl font-serif font-bold tracking-tight text-white">
                            BatchBlitz Pro
                        </h2>
                        <p className="text-white/60 text-sm max-w-xs mx-auto leading-relaxed font-sans">
                            Unlock unrestricted power for your studio.
                        </p>
                    </div>

                    {/* Features */}
                    <div className="space-y-4 py-4 border-y border-white/10">
                        {[
                            "Upload Custom Logo Watermarks (PNG)",
                            "Unlimited Batch Size (Process 1000+ files)",
                            "Save Workflow Presets",
                            "Smart Renaming Variables",
                            "Commercial Usage Rights"
                        ].map((feature, i) => (
                            <div key={i} className="flex items-center gap-4 text-sm text-gray-200 font-sans">
                                <div className="bg-accent-gold/20 p-0.5 rounded-full flex-shrink-0">
                                    <Check size={14} className="text-accent-gold" strokeWidth={3} />
                                </div>
                                <span className="font-medium">{feature}</span>
                            </div>
                        ))}
                    </div>

                    {/* Pricing */}
                    <div className="text-center">
                        <div className="text-4xl font-serif font-bold text-white mb-1">
                            $4.99
                            <span className="text-sm font-sans font-medium text-white/40 ml-1">/ month</span>
                        </div>
                    </div>

                    <button
                        onClick={handleDevUpgrade}
                        className="group relative w-full py-4 rounded-xl overflow-hidden bg-gradient-to-r from-yellow-600 via-accent-gold to-yellow-500 bg-[length:200%_auto] hover:bg-[position:right_center] transition-all duration-500 shadow-xl shadow-accent-gold/20 hover:shadow-accent-gold/40 border border-white/20 active:scale-[0.98]"
                    >
                        <div className="absolute inset-0 bg-white/20 group-hover:opacity-0 transition-opacity duration-500" />
                        <div className="relative flex items-center justify-center gap-3">
                            <Zap className="fill-white animate-pulse" size={20} strokeWidth={2.5} />
                            <span className="text-white font-bold text-lg tracking-wide shadow-black/10 drop-shadow-sm">UPGRADE NOW</span>
                        </div>
                    </button>

                    <p className="text-center text-[10px] text-white/30 font-sans">
                        Secure Sandbox Payment. Cancel anytime.
                    </p>
                </div>
            </div>
        </div>
    );
};