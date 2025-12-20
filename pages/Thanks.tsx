import React, { useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Check, ShieldCheck, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import confetti from 'canvas-confetti';

export const Thanks: React.FC = () => {
    const navigate = useNavigate();
    const { setPro } = useStore();

    useEffect(() => {
        // Activate Pro
        setPro(true);
        // Celebration
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#D4AF37', '#FFD700', '#F4C430'] // Gold colors
        });
    }, [setPro]);

    return (
        <div className="min-h-screen bg-paper-base flex flex-col font-sans">
            <Navbar />

            <div className="flex-1 flex items-center justify-center p-4">
                <div className="bg-white p-8 md:p-12 rounded-3xl shadow-float border border-white/50 text-center max-w-md w-full animate-in zoom-in-95 duration-500">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 shadow-lg shadow-green-100/50">
                        <Check size={40} strokeWidth={3} />
                    </div>

                    <h1 className="text-3xl font-serif font-bold text-ink-main mb-2">Purchase Successful!</h1>
                    <p className="text-ink-muted mb-8">
                        Welcome to BatchBlitz Pro. Your studio has been upgraded with unlimited power.
                    </p>

                    <div className="bg-gray-50 rounded-xl p-4 mb-8 text-left space-y-3 border border-gray-100">
                        <div className="flex items-center gap-3 text-sm text-ink-main font-bold">
                            <ShieldCheck size={16} className="text-accent-gold" />
                            Pro License Active
                        </div>
                        <div className="flex items-center gap-3 text-sm text-ink-main font-bold">
                            <ShieldCheck size={16} className="text-accent-gold" />
                            Receipt sent to email
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/')}
                        className="w-full py-4 bg-ink-main text-white font-bold rounded-xl shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2 group"
                    >
                        Enter Studio
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
};
