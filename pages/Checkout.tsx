import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { PayPalSubscriptionButton } from '../components/PayPalSubscriptionButton';
import { Navbar } from '../components/Navbar';
import { Zap, ShieldCheck, ArrowLeft } from 'lucide-react';

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
      
      <div className="flex-1 py-12 px-4 flex items-center justify-center">
        <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 md:gap-16">
            
            {/* Order Summary */}
            <div className="space-y-8 animate-in slide-in-from-left duration-500">
                <div>
                    <button onClick={() => navigate('/')} className="flex items-center text-ink-muted hover:text-ink-main mb-6 text-sm font-bold transition-colors">
                        <ArrowLeft size={16} className="mr-2" /> Back to Studio
                    </button>
                    <h1 className="text-4xl font-serif font-bold text-ink-main mb-2">Checkout</h1>
                    <p className="text-ink-muted">Complete your upgrade to unlock all features.</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-debossed border border-white/50">
                    <div className="flex items-start justify-between border-b border-gray-100 pb-6 mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-ink-main rounded-lg flex items-center justify-center text-accent-gold shadow-md">
                                <Zap size={24} fill="currentColor" />
                            </div>
                            <div>
                                <h3 className="font-bold text-ink-main text-lg">BatchBlitz Pro</h3>
                                <p className="text-xs text-ink-muted">Monthly Subscription</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="font-bold text-xl text-ink-main">$4.99</div>
                            <div className="text-xs text-ink-muted">/ month</div>
                        </div>
                    </div>

                    <div className="space-y-3">
                         <div className="flex justify-between text-sm text-ink-muted">
                             <span>Subtotal</span>
                             <span>$4.99</span>
                         </div>
                         <div className="flex justify-between text-sm text-ink-muted">
                             <span>Tax</span>
                             <span>$0.00</span>
                         </div>
                         <div className="flex justify-between text-lg font-bold text-ink-main pt-3 border-t border-gray-100">
                             <span>Total</span>
                             <span>$4.99</span>
                         </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-ink-muted bg-gray-100/50 p-4 rounded-xl">
                    <ShieldCheck size={16} className="text-green-600" />
                    Secure Sandbox Payment Processing via PayPal
                </div>
            </div>

            {/* Payment Column */}
            <div className="flex flex-col justify-center animate-in slide-in-from-right duration-500 delay-100">
                <div className="bg-white p-8 rounded-2xl shadow-float border border-white text-center space-y-6">
                    <h2 className="text-xl font-bold text-ink-main">Payment Method</h2>
                    <p className="text-sm text-ink-muted">Login with a Sandbox Account to test.</p>
                    
                    {/* Temporarily Disabled
                    <div className="py-4">
                        <PayPalSubscriptionButton />
                    </div>
                    */}
                    
                    <button 
                        onClick={handleDevBypass}
                        className="w-full py-4 bg-accent-gold text-white font-bold rounded-xl shadow-lg hover:bg-yellow-600 transition-colors"
                    >
                        Dev Bypass: Upgrade Instantly
                    </button>

                    <p className="text-[10px] text-ink-muted text-center max-w-xs mx-auto">
                        By confirming your subscription, you allow BatchBlitz (Sandbox) to charge your future payment methods for this subscription and any future payments.
                    </p>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};