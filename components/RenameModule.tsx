import React from 'react';
import { FileEdit, Lock, Hash } from 'lucide-react';
import { AppSettings } from '../types';
import { InfoTooltip } from './InfoTooltip';

interface RenameModuleProps {
  settings: AppSettings;
  updateSettings: (newSettings: AppSettings) => void;
  isPro: boolean;
  onShowPaywall: () => void;
}

export const RenameModule: React.FC<RenameModuleProps> = ({ settings, updateSettings, isPro, onShowPaywall }) => {
  const { rename } = settings;

  const handleToggle = (enabled: boolean) => {
    updateSettings({ ...settings, rename: { ...rename, enabled } });
  };

  const handlePatternChange = (pattern: string) => {
    updateSettings({ ...settings, rename: { ...rename, pattern } });
  };

  const handleSequenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val) && val >= 0) {
      updateSettings({ ...settings, rename: { ...rename, startSequence: val } });
    }
  };

  const insertVariable = (variable: string) => {
    if (!isPro) return onShowPaywall();
    handlePatternChange(rename.pattern + variable);
  };

  return (
    <div className="space-y-4">
      {/* Enable Toggle - REMOVED, Auto-detected */}
      <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center">
          <label className="text-sm text-ink-main font-bold">Rename Files</label>
          <InfoTooltip content={`**Rename Variables:**\n• {n} = Auto-numbering\n• {date} = Today's date\n• {original} = Original filename\n\n**Tip:** Use 'Start #' to begin counting from a specific number (e.g. 100).`} />
        </div>

        {/* Apple Style Toggle */}
        <button
          onClick={() => handleToggle(!rename.enabled)}
          className={`w-10 h-6 rounded-full relative transition-colors duration-200 ease-in-out focus:outline-none ${rename.enabled ? 'bg-apple-green' : 'bg-gray-200'}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${rename.enabled ? 'translate-x-4' : 'translate-x-0'}`}
          />
        </button>
      </div>

      {/* Pattern Input - Always Visible */}
      <div className={`space-y-3 transition-opacity duration-200 ${!rename.enabled ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
        <div className="relative">
          {!isPro && (
            <button
              onClick={onShowPaywall}
              className="absolute right-2 top-2 z-10 p-1.5 bg-gray-100 rounded-md text-ink-muted hover:text-accent-gold transition-colors"
              title="Unlock Custom Renaming"
            >
              <Lock size={12} />
            </button>
          )}
          <label className="text-[10px] text-ink-muted font-bold uppercase block mb-1.5 ml-1">Filename Pattern</label>
          <input
            type="text"
            value={isPro ? rename.pattern : '{original}_{n}'}
            onChange={(e) => isPro ? handlePatternChange(e.target.value) : onShowPaywall()}
            readOnly={!isPro}
            className={`w-full bg-white rounded-xl px-4 py-3 text-sm text-ink-main shadow-sm border focus:ring-2 focus:ring-accent-gold/20 transition-all font-mono
               ${isPro ? 'border-gray-200 focus:border-accent-gold' : 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed'}
             `}
          />
        </div>

        {/* Variables & Start # */}
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <span className="text-[10px] text-ink-muted font-medium mb-2 block">Variables</span>
            <div className="flex flex-wrap gap-2">
              {[
                { label: '{original}', desc: 'Original Name' },
                { label: '{n}', desc: 'Number Sequence' },
                { label: '{date}', desc: 'YYYY-MM-DD' }
              ].map((chip) => (
                <button
                  key={chip.label}
                  onClick={() => insertVariable(chip.label)}
                  disabled={!isPro}
                  className={`
                            px-2 py-1 rounded-md text-[10px] font-mono border transition-all
                            ${isPro
                      ? 'bg-white border-gray-200 hover:border-accent-gold text-ink-main shadow-sm'
                      : 'bg-gray-100 border-transparent text-gray-400 cursor-not-allowed'}
                        `}
                  title={chip.desc}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Start Sequence Input */}
          <div className="w-16">
            <label className="text-[10px] text-ink-muted font-medium mb-2 block whitespace-nowrap">Start #</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                value={rename.startSequence || 1}
                onChange={handleSequenceChange}
                disabled={!isPro}
                className={`w-full bg-white rounded-lg pl-3 pr-1 py-1 text-xs font-mono border focus:outline-none focus:border-accent-gold
                            ${isPro ? 'border-gray-200 text-ink-main' : 'border-transparent bg-gray-100 text-gray-400 cursor-not-allowed'}
                        `}
              />
            </div>
          </div>
        </div>

        {!isPro && (
          <div className="text-[10px] text-ink-muted bg-yellow-50/50 p-2 rounded-lg border border-yellow-100/50">
            <span className="font-bold">Free Plan:</span> Basic numbering only. <br />
            <span className="font-bold">Pro:</span> Smart patterns & dates.
          </div>
        )}
      </div>
    </div>
  );
};