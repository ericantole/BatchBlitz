import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { AppSettings } from '../types';
import { ChevronDown, Lock, RotateCcw, Check } from 'lucide-react';
import { useToast } from './Toast';

interface PresetSelectorProps {
  onSelect: (settings: AppSettings) => void;
  onReset: () => void;
  isPro: boolean;
  onShowPaywall: () => void;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({ 
    onSelect, 
    onReset,
    isPro,
    onShowPaywall
}) => {
  const { presets, selectedPresetId, setSelectedPresetId } = useStore();
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (id: string) => {
    setIsOpen(false);
    
    if (id === 'default') {
        setSelectedPresetId('default');
        onReset();
        return;
    }

    if (!isPro) {
        onShowPaywall();
        return;
    }
    
    const preset = presets.find(p => p.id === id);
    if (preset) {
        setSelectedPresetId(id);
        onSelect(preset.settings);
        showToast(`Loaded "${preset.name}"`, 'success');
    }
  };

  const getSelectedName = () => {
    if (!selectedPresetId || selectedPresetId === 'default') return 'Default (None)';
    const preset = presets.find(p => p.id === selectedPresetId);
    return preset ? preset.name : 'Default (None)';
  };

  const handleLocalReset = () => {
      setSelectedPresetId('default');
      onReset();
  }

  return (
    <div className="flex flex-col gap-1.5 mb-6 relative z-50" ref={dropdownRef}>
        <div className="flex items-center justify-between px-1">
            <label className="text-xs font-medium text-ink-muted uppercase tracking-wider">
                Workflow Preset
            </label>
            <button 
                onClick={handleLocalReset}
                className="text-ink-muted hover:text-ink-main transition-colors p-1 rounded-md hover:bg-black/5"
                title="Reset to Defaults"
            >
                <RotateCcw size={10} />
            </button>
        </div>

        {/* Trigger Button */}
        <button
            onClick={() => setIsOpen(!isOpen)}
            className={`
                w-full flex items-center justify-between bg-white px-3 h-10 rounded-lg border 
                text-xs font-medium text-ink-main shadow-sm transition-all
                ${isOpen ? 'border-accent-gold ring-1 ring-accent-gold/20' : 'border-gray-200 hover:border-gray-300'}
            `}
        >
            <span className="truncate">{getSelectedName()}</span>
            <div className="flex items-center gap-1.5 text-ink-muted">
                {!isPro && <Lock size={10} className="text-accent-gold" />}
                <ChevronDown size={12} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </div>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-gray-100 rounded-xl shadow-xl p-1 animate-in fade-in zoom-in-95 duration-100 origin-top z-50 overflow-hidden">
                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                    <button
                        onClick={() => handleSelect('default')}
                        className={`
                            w-full text-left px-3 py-2.5 text-xs rounded-lg flex items-center justify-between group transition-colors
                            ${selectedPresetId === 'default' ? 'bg-gray-100 font-bold' : 'hover:bg-gray-50 text-ink-muted hover:text-ink-main'}
                        `}
                    >
                        <span>Default (None)</span>
                        {selectedPresetId === 'default' && <Check size={12} />}
                    </button>

                    {presets.length > 0 && <div className="h-px bg-gray-100 my-1" />}

                    {presets.map((preset) => (
                        <button
                            key={preset.id}
                            onClick={() => handleSelect(preset.id)}
                            className={`
                                w-full text-left px-3 py-2.5 text-xs rounded-lg flex items-center justify-between group transition-colors
                                ${selectedPresetId === preset.id ? 'bg-accent-gold/10 text-accent-gold font-bold' : 'hover:bg-gray-50 text-ink-muted hover:text-ink-main'}
                            `}
                        >
                            <span className="truncate">{preset.name}</span>
                            {selectedPresetId === preset.id && <Check size={12} />}
                        </button>
                    ))}
                    
                    {presets.length === 0 && (
                        <div className="px-3 py-3 text-[10px] text-ink-muted text-center italic">
                            No saved presets
                        </div>
                    )}
                </div>
                
                {!isPro && (
                     <button 
                        onClick={() => { setIsOpen(false); onShowPaywall(); }}
                        className="w-full mt-1 p-2 bg-accent-gold/5 text-accent-gold text-[10px] font-bold uppercase tracking-wide rounded-lg hover:bg-accent-gold/10 transition-colors flex items-center justify-center gap-1"
                     >
                        <Lock size={10} /> Unlock Presets
                     </button>
                )}
            </div>
        )}
    </div>
  );
};