import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { PayPalSubscriptionButton } from '../components/PayPalSubscriptionButton';
import { Navbar } from '../components/Navbar';
import { Zap, ShieldCheck, ArrowLeft, Check, Lock, CreditCard, Award } from 'lucide-react';

export const Checkout: React.FC = () => {
    const { user, isPro, setPro } = useStore();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate('/login?next=/checkout');
        }
    }, [user, navigate]);

    const handleDevBypass = () => {
        setPro(true);
        alert('Dev Mode: Subscription Activated');
        navigate('/');
    }

    if (isPro) {
        return (
            <div className="min-h-screen bg-paper-base flex flex-col">
                <Navbar />
                <div className="flex-1 flex items-center justify-center p-4">
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                            <ShieldCheck size={32} />
                        </div>
                        <h1 className="text-2xl font-bold text-ink-main">You are already a Pro Member</h1>
                        <button onClick={() => navigate('/')} className="text-accent-gold font-bold hover:underline">
                            Return to Studio
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-paper-base flex flex-col">
            <Navbar />

            <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">

                {/* Back Button Row */}
                <div className="w-full max-w-5xl mb-6">
                    <button onClick={() => navigate('/')} className="flex items-center text-ink-muted hover:text-ink-main text-sm font-bold transition-colors">
                        <ArrowLeft size={16} className="mr-2" /> Back to Studio
                    </button>
                </div>

                <div className="w-full max-w-5xl grid md:grid-cols-2 gap-4 items-stretch">

                    {/* Features Column */}
                    <div className="flex flex-col h-full animate-in slide-in-from-left duration-500">
                        <div className="bg-white p-6 rounded-2xl shadow-debossed border border-white/50 flex-1 flex flex-col">
                            <div className="mb-6">
                                <h1 className="text-3xl font-serif font-bold text-ink-main mb-2">Upgrade to Pro</h1>
                                <p className="text-ink-muted">Unlock the full potential of BatchBlitz Studio.</p>
                            </div>

                            <div className="flex items-start justify-between border-b border-gray-100 pb-6 mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-ink-main rounded-xl flex items-center justify-center text-accent-gold shadow-md">
                                        <Zap size={28} fill="currentColor" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-ink-main text-xl">BatchBlitz Pro</h3>
                                        <p className="text-xs text-ink-muted">Monthly Subscription</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-2xl text-ink-main">$4.99</div>
                                    <div className="text-xs text-ink-muted">/ month</div>
                                </div>
                            </div>

                            <div className="space-y-4 flex-1">
                                <div className="text-sm font-bold text-ink-main uppercase tracking-wider mb-4">What you get:</div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                                    {[
                                        { title: "Unlimited Processing", desc: "No daily limits on batches." },
                                        { title: "Custom Watermarks", desc: "Upload your own brand logo." },
                                        { title: "Workflow Presets", desc: "Save & reuse settings." },
                                        { title: "Advanced Renaming", desc: "Smart pattern engine." },
                                        { title: "Zero-Lag Performance", desc: "Optimized for massive batches." },
                                        { title: "Early Feature Access", desc: "Get new tools before everyone else." }
                                    ].map((benefit, i) => (
                                        <div key={i} className="group p-2.5 rounded-xl hover:bg-gray-50 transition-all cursor-default border border-transparent hover:border-gray-100 h-fit">
                                            <div className="flex items-center gap-3 text-sm text-ink-main font-medium">
                                                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                                    <Check size={12} className="text-green-600" strokeWidth={3} />
                                                </div>
                                                {benefit.title}
                                            </div>
                                            <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-300 ease-out pl-8">
                                                <div className="overflow-hidden">
                                                    <p className="text-xs text-ink-muted pt-1 leading-relaxed">
                                                        {benefit.desc}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Column */}
                    <div className="flex flex-col h-full animate-in slide-in-from-right duration-500 delay-100">
                        <div className="bg-white p-6 rounded-2xl shadow-float border border-white text-center space-y-6 relative overflow-hidden flex-1 flex flex-col justify-center">
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-accent-gold via-yellow-400 to-accent-gold" />

                            <div className="space-y-1 pt-4">
                                <h2 className="text-2xl font-bold text-ink-main">Complete Payment</h2>
                                <p className="text-sm text-ink-muted">Login with a Sandbox Account to test.</p>
                            </div>

                            <div className="py-4 relative group">
                                <div className="absolute inset-0 bg-yellow-400 blur-xl opacity-20 group-hover:opacity-40 transition-opacity animate-pulse rounded-xl duration-1000" />
                                <button
                                    onClick={() => navigate('/thanks')}
                                    className="relative w-full py-5 bg-gradient-to-r from-accent-gold to-yellow-500 text-white font-bold text-xl rounded-xl shadow-lg hover:shadow-yellow-400/50 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 group overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out skew-x-12" />
                                    <span>Subscribe Now</span>
                                    <Zap size={24} className="fill-current group-hover:rotate-12 transition-transform" />
                                </button>
                            </div>

                            {/* Trust Badges */}
                            <div className="grid grid-cols-3 gap-2 py-4 opacity-60 grayscale hover:grayscale-0 transition-all duration-500 border-t border-b border-gray-50">
                                <div className="flex flex-col items-center gap-1">
                                    <Lock size={16} className="text-ink-main" />
                                    <span className="text-[9px] uppercase font-bold text-ink-muted">Secure SSL</span>
                                </div>
                                <div className="flex flex-col items-center gap-1">
                                    <Zap size={16} className="text-ink-main" />
                                    <span className="text-[9px] uppercase font-bold text-ink-muted">Instant Access</span>
                                </div>
                                <div className="flex flex-col items-center gap-1">
                                    <Award size={16} className="text-ink-main" />
                                    <span className="text-[9px] uppercase font-bold text-ink-muted">Satisfaction</span>
                                </div>
                            </div>

                            <div className="mt-auto space-y-1 pb-2">
                                <button
                                    onClick={() => navigate('/')}
                                    className="text-xs text-ink-muted hover:text-red-500 underline decoration-gray-300 hover:decoration-red-500 transition-colors block mx-auto pb-2"
                                >
                                    No thanks, I'll stay on the free plan
                                </button>

                                <p className="text-[10px] text-ink-muted/40 text-center max-w-xs mx-auto leading-tight">
                                    Secure Sandbox Payment Processing. <br />
                                    By confirming, you agree to our Terms of Service.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};