import React from 'react';
import { X, Zap, Infinity, Lock, Shield } from 'lucide-react';
import { Button } from './Button';
import { useStore } from '../store/useStore';

interface PaywallModalProps {
  onClose: () => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({ onClose }) => {
  const setPro = useStore((state) => state.setPro);

  const handleDevUpgrade = () => {
    // DEV MODE: Bypass Payment Gateway
    console.log('DEV MODE: Premium Activated');
    
    // 1. Update Global State
    setPro(true);
    
    // 2. Feedback
    alert("DEV MODE: Premium Activated. You can now use custom logo watermarks and unlimited batches.");
    
    // 3. Close
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-white/80 backdrop-blur-sm animate-in fade-in duration-500" 
        onClick={onClose} 
      />
      
      <div className="relative w-full max-w-md bg-paper-base rounded-2xl shadow-float overflow-hidden animate-in zoom-in-95 duration-300 border border-white">
        
        <div className="relative p-8 space-y-8">
            <button 
                onClick={onClose} 
                className="absolute top-4 right-4 p-2 hover:bg-black/5 rounded-full transition-colors text-ink-muted hover:text-ink-main"
            >
                <X size={20} strokeWidth={1.5} />
            </button>

            <div className="text-center space-y-4 pt-2">
                <div className="w-16 h-16 mx-auto bg-white rounded-full flex items-center justify-center shadow-card mb-2 border border-accent-gold/20">
                    <Zap className="w-8 h-8 text-accent-gold fill-accent-gold" />
                </div>
                <h2 className="text-3xl font-serif font-bold tracking-tight text-ink-main">
                    BatchBlitz Pro
                </h2>
                <p className="text-ink-muted text-sm max-w-xs mx-auto leading-relaxed font-sans">
                    Unlock the full studio workflow.
                </p>
            </div>

            {/* Features */}
            <div className="space-y-4 py-4 border-y border-ink-muted/10">
                {[
                    { icon: Lock, text: "Upload Custom Logo Watermarks (PNG)" },
                    { icon: Infinity, text: "Unlimited Batch Size (Process 1000+ files)" },
                    { icon: Shield, text: "One-Click Workflows (Save Presets)" },
                ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-4 text-sm text-ink-main font-sans">
                        <div className="w-8 h-8 rounded-full bg-paper-dark/50 flex items-center justify-center shadow-pressed text-accent-gold">
                            <feature.icon size={14} strokeWidth={2} />
                        </div>
                        <span className="font-medium">{feature.text}</span>
                    </div>
                ))}
            </div>

            {/* Pricing */}
            <div className="text-center">
                 <div className="text-4xl font-serif font-bold text-ink-main mb-1">
                    $4.99
                    <span className="text-sm font-sans font-medium text-ink-muted ml-1">/ month</span>
                </div>
            </div>

            <Button 
                variant="primary" 
                fullWidth 
                size="lg" 
                className="bg-accent-gold text-white shadow-lg hover:shadow-xl font-bold py-4 rounded-xl"
                onClick={handleDevUpgrade}
            >
                Upgrade to Pro (Dev Mode)
            </Button>

            <p className="text-center text-[10px] text-ink-muted font-sans bg-yellow-50 p-2 rounded border border-yellow-100 text-yellow-800">
                <strong>DEV ENVIRONMENT:</strong> Clicking upgrade will instantly enable Pro features without charging a card.
            </p>
        </div>
      </div>
    </div>
  );
};