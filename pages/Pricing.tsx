import React from 'react';
import { Navbar } from '../components/Navbar';
import { Button } from '../components/Button';
import { Check, X, Zap, Crown, Image as ImageIcon, ShieldCheck } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';

import { useToast } from '../components/Toast';

export const Pricing: React.FC = () => {
    const { setPro, isPro, user } = useStore();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const handleDevUpgrade = () => {
        if (!user) {
            navigate('/login?next=/checkout&reason=upgrade');
            return;
        }
        setPro(true);
        showToast("Dev Mode: You are now a Pro user!", "success");
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-paper-base flex flex-col font-sans">
            <Navbar onLoginClick={() => navigate('/login')} />

            <div className="flex-1 pt-32 pb-20 px-4 md:px-8 max-w-7xl mx-auto w-full">

                {/* Header */}
                <div className="text-center mb-16 space-y-4">
                    <h1 className="text-5xl md:text-7xl font-serif font-bold text-ink-main tracking-tight">
                        Studio Plans
                    </h1>
                    <p className="text-xl text-ink-muted max-w-2xl mx-auto font-light">
                        Professional tools for your creative workflow.
                    </p>
                </div>

                {/* Bento Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">

                    {/* Free Card */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
                        <div className="mb-6">
                            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-4 text-ink-main">
                                <ImageIcon size={24} />
                            </div>
                            <h3 className="text-2xl font-bold text-ink-main">Basic Studio</h3>
                            <p className="text-ink-muted mt-2 text-sm">Essential tools for quick tasks.</p>
                        </div>

                        <div className="text-4xl font-serif font-bold text-ink-main mb-8">Free</div>

                        <ul className="space-y-4 flex-1 mb-8">
                            {[
                                "20 Images per batch",
                                "Basic Renaming",
                                "Text Watermarks Only",
                                "Standard Resolution",
                                "Local Processing"
                            ].map((feat, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm text-ink-muted">
                                    <Check size={16} className="text-gray-400" />
                                    {feat}
                                </li>
                            ))}
                        </ul>

                        <Button variant="secondary" fullWidth disabled className="opacity-50">
                            Current Plan
                        </Button>
                    </div>

                    {/* Pro Card (Hero) */}
                    <div className="lg:col-span-2 bg-gradient-to-br from-[#1c1c1e] to-[#2c2c2e] p-8 rounded-3xl shadow-2xl border border-white/10 flex flex-col md:flex-row relative overflow-hidden group text-white">

                        {/* Background Glow */}
                        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-accent-gold/20 blur-[100px] rounded-full pointer-events-none translate-x-1/3 -translate-y-1/3"></div>

                        <div className="flex-1 z-10 flex flex-col">
                            <div className="mb-6">
                                <div className="w-12 h-12 bg-accent-gold rounded-2xl flex items-center justify-center mb-4 text-white shadow-lg shadow-accent-gold/20">
                                    <Zap size={24} fill="currentColor" />
                                </div>
                                <h3 className="text-3xl font-bold text-white">BatchBlitz Pro</h3>
                                <p className="text-white/60 mt-2 text-sm">Unrestricted power for professionals.</p>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4 flex-1 mb-8">
                                {[
                                    "Unlimited Batch Size",
                                    "Custom Logo Watermarks (PNG)",
                                    "Advanced Pattern Renaming",
                                    "Save Workflow Presets",
                                    "Priority Processing",
                                    "Commercial Usage Rights"
                                ].map((feat, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm text-gray-300 font-medium">
                                        <div className="bg-accent-gold/20 p-0.5 rounded-full">
                                            <Check size={14} className="text-accent-gold" strokeWidth={3} />
                                        </div>
                                        {feat}
                                    </li>
                                ))}
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-4 mt-auto">
                                <div className="text-left">
                                    <div className="text-4xl font-serif font-bold text-white">$4.99</div>
                                    <div className="text-xs text-white/40">per month</div>
                                </div>
                                <div className="flex-1 w-full sm:w-auto">
                                    {isPro ? (
                                        <Button variant="secondary" fullWidth onClick={() => navigate('/')}>Return to Studio</Button>
                                    ) : (
                                        <button
                                            onClick={handleDevUpgrade}
                                            className="group relative w-full h-16 rounded-xl overflow-hidden bg-gradient-to-r from-yellow-600 via-accent-gold to-yellow-500 bg-[length:200%_auto] hover:bg-[position:right_center] transition-all duration-500 shadow-xl shadow-accent-gold/20 hover:shadow-accent-gold/40 border border-white/20 active:scale-[0.98]"
                                        >
                                            <div className="absolute inset-0 bg-white/20 group-hover:opacity-0 transition-opacity duration-500" />
                                            <div className="relative flex items-center justify-center gap-3">
                                                <Zap className="fill-white animate-pulse" size={24} strokeWidth={2.5} />
                                                <span className="text-white font-bold text-xl tracking-wide shadow-black/10 drop-shadow-sm">UPGRADE NOW</span>
                                            </div>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Security Card */}
                    <div className="md:col-span-2 lg:col-span-3 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between gap-8 mt-4">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-600 flex-shrink-0">
                                <ShieldCheck size={32} />
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-ink-main">Privacy Guarantee</h4>
                                <p className="text-sm text-ink-muted max-w-xl">
                                    We use a Zero-Trust architecture. Your images are processed entirely within your browser's secure sandbox and are never uploaded to our servers.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};