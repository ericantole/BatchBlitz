import React from 'react';
import { Check, Zap, Lock } from 'lucide-react';
import { Button } from './Button';
import { useNavigate } from 'react-router-dom';

export const PricingSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full py-24 px-4 relative z-20 bg-paper-base border-t border-ink-muted/10">
      <div className="max-w-6xl mx-auto space-y-16">
        
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-ink-main">
            Simple, Transparent Pricing
          </h2>
          <p className="text-ink-muted text-lg max-w-2xl mx-auto">
            Choose the workflow that fits your studio needs.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Tier */}
          <div className="bg-white p-8 rounded-2xl shadow-debossed border border-white flex flex-col relative overflow-hidden">
            <div className="space-y-4 mb-8">
              <h3 className="text-2xl font-bold text-ink-main">Basic Access</h3>
              <div className="text-4xl font-serif font-bold text-ink-main">$0</div>
              <p className="text-ink-muted text-sm">Perfect for quick tasks.</p>
            </div>
            
            <ul className="space-y-4 flex-1 mb-8">
              {[
                "Batch up to 20 images",
                "Standard Text Watermarks",
                "Basic Resize & Convert",
                "Local Processing"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-ink-main">
                  <Check size={16} className="text-ink-muted" />
                  {item}
                </li>
              ))}
            </ul>

            <Button variant="secondary" fullWidth disabled className="opacity-50">
              Current Plan
            </Button>
          </div>

          {/* Pro Tier */}
          <div className="bg-ink-main p-8 rounded-2xl shadow-float border border-ink-main flex flex-col relative overflow-hidden text-white transform md:-translate-y-4">
            <div className="absolute top-0 right-0 p-4">
                <div className="bg-accent-gold text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Most Popular
                </div>
            </div>

            <div className="space-y-4 mb-8">
              <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                <Zap className="text-accent-gold fill-accent-gold" size={24} />
                BatchBlitz Pro
              </h3>
              <div className="text-4xl font-serif font-bold text-accent-gold">
                $4.99<span className="text-lg text-white/50 font-sans font-medium">/mo</span>
              </div>
              <p className="text-white/60 text-sm">The complete studio suite.</p>
            </div>
            
            <ul className="space-y-4 flex-1 mb-8">
              {[
                "Unlimited Batch Size",
                "Custom Logo Watermarks (PNG)",
                "Save Preset Workflows",
                "Priority Support",
                "Commercial License"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-white/90">
                  <div className="bg-accent-gold/20 p-1 rounded-full text-accent-gold">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  {item}
                </li>
              ))}
            </ul>

            <Button 
                variant="neon" 
                fullWidth 
                onClick={() => navigate('/checkout')}
                className="bg-accent-gold text-white hover:bg-white hover:text-ink-main border-none shadow-lg"
            >
              Upgrade Now
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};