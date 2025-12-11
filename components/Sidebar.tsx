import React, { useState } from 'react';
import { Settings, Image as ImageIcon, Type, Zap, ChevronDown, ChevronRight, Lock, Sliders, Upload, Shield } from 'lucide-react';
import { AppSettings, OutputFormat } from '../types';

interface SidebarProps {
  settings: AppSettings;
  updateSettings: (newSettings: AppSettings) => void;
  isPro?: boolean;
  onShowPaywall?: () => void;
  onShowSecurity?: () => void;
}

const AccordionItem: React.FC<{
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  active?: boolean;
}> = ({ title, icon: Icon, children, isOpen, onToggle, active }) => (
  <div className="mb-4 last:mb-0">
    <button
      onClick={onToggle}
      className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200 
      ${active ? 'text-ink-main' : 'text-ink-muted hover:text-ink-main'}
      ${isOpen ? 'bg-white/50 shadow-sm' : 'hover:bg-white/30'}`}
    >
      <div className="flex items-center gap-3">
        <Icon size={20} strokeWidth={1.5} className={active ? 'text-accent-gold' : 'text-ink-muted'} />
        <span className="font-bold text-sm tracking-wide">{title}</span>
      </div>
      {isOpen ? <ChevronDown size={16} className="text-ink-muted" /> : <ChevronRight size={16} className="text-ink-muted" />}
    </button>
    {isOpen && <div className="p-2 pt-4 space-y-6 animate-in slide-in-from-top-1 duration-200">{children}</div>}
  </div>
);

// Apple-Style Toggle
const AppleToggle: React.FC<{ checked: boolean; onChange: (val: boolean) => void }> = ({ checked, onChange }) => (
  <button 
    onClick={() => onChange(!checked)}
    className={`w-12 h-7 rounded-full relative transition-colors duration-200 ease-in-out focus:outline-none ${checked ? 'bg-apple-green' : 'bg-gray-200'}`}
  >
    <span 
      className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${checked ? 'translate-x-5' : 'translate-x-0'}`} 
    />
  </button>
);

// Custom styled range input (Pressed Well)
const SynthSlider: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string, displayValue: string }> = ({ label, displayValue, ...props }) => (
  <div className="space-y-4 group bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
    <div className="flex justify-between text-xs font-medium text-ink-muted">
      <span>{label}</span>
      <span className="text-ink-main font-bold">{displayValue}</span>
    </div>
    <div className="relative h-6 flex items-center w-full">
      <input
        type="range"
        className="w-full h-2 bg-gray-100 rounded-full appearance-none cursor-pointer focus:outline-none 
        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 
        [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white 
        [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-gray-200
        [&::-webkit-slider-thumb]:shadow-md
        [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110
        "
        {...props}
      />
    </div>
  </div>
);

export const Sidebar: React.FC<SidebarProps> = ({ settings, updateSettings, isPro = false, onShowPaywall, onShowSecurity }) => {
  const [openSection, setOpenSection] = useState<string | null>('resize');

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const handleResizeChange = (key: keyof typeof settings.resize, value: any) => {
    updateSettings({ ...settings, resize: { ...settings.resize, [key]: value } });
  };

  const handleWatermarkChange = (key: keyof typeof settings.watermark, value: any) => {
    updateSettings({ ...settings, watermark: { ...settings.watermark, [key]: value } });
  };

  const handleConvertChange = (key: keyof typeof settings.convert, value: any) => {
    updateSettings({ ...settings, convert: { ...settings.convert, [key]: value } });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isPro) {
        onShowPaywall?.();
        return;
    }
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            handleWatermarkChange('imageData', event.target?.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  return (
    <aside className="w-full h-full flex flex-col bg-[#F2F2F0] rounded-2xl shadow-debossed overflow-hidden p-6">
      <div className="flex items-center justify-between mb-8 px-2">
        <div className="flex items-center gap-2 text-ink-main">
          <Sliders size={20} strokeWidth={1.5} />
          <span className="font-bold text-base tracking-wide">Settings</span>
        </div>
        {!isPro && (
          <button 
            onClick={onShowPaywall}
            className="text-xs bg-white text-accent-gold border border-accent-gold/20 px-4 py-1.5 rounded-full font-bold shadow-sm hover:shadow-md transition-all"
          >
            PRO
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        {/* Resize Module */}
        <AccordionItem
          title="Dimensions"
          icon={ImageIcon}
          isOpen={openSection === 'resize'}
          onToggle={() => toggleSection('resize')}
          active={settings.resize.enabled}
        >
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <label className="text-xs text-ink-main font-medium">Enable Resize</label>
            <AppleToggle 
              checked={settings.resize.enabled} 
              onChange={(val) => handleResizeChange('enabled', val)} 
            />
          </div>

          <div className={`space-y-4 transition-all duration-300 ${settings.resize.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            <div className="flex bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm">
              <button
                onClick={() => handleResizeChange('type', 'percentage')}
                className={`flex-1 text-xs py-3 font-medium rounded-lg transition-all ${settings.resize.type === 'percentage' ? 'bg-paper-dark text-ink-main shadow-inner' : 'text-ink-muted hover:text-ink-main'}`}
              >
                Scale %
              </button>
              <button
                onClick={() => handleResizeChange('type', 'width')}
                className={`flex-1 text-xs py-3 font-medium rounded-lg transition-all ${settings.resize.type === 'width' ? 'bg-paper-dark text-ink-main shadow-inner' : 'text-ink-muted hover:text-ink-main'}`}
              >
                Width px
              </button>
            </div>

            <SynthSlider 
                label="Target Size"
                displayValue={`${settings.resize.value}${settings.resize.type === 'percentage' ? '%' : 'px'}`}
                min={settings.resize.type === 'percentage' ? 10 : 100}
                max={settings.resize.type === 'percentage' ? 200 : 3840}
                value={settings.resize.value}
                onChange={(e) => handleResizeChange('value', parseInt(e.target.value))}
            />
          </div>
        </AccordionItem>

        {/* Watermark Module */}
        <AccordionItem
          title="Watermark"
          icon={Type}
          isOpen={openSection === 'watermark'}
          onToggle={() => toggleSection('watermark')}
          active={settings.watermark.enabled}
        >
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <label className="text-xs text-ink-main font-medium">Enable Watermark</label>
            <AppleToggle 
              checked={settings.watermark.enabled} 
              onChange={(val) => handleWatermarkChange('enabled', val)} 
            />
          </div>

          <div className={`space-y-4 transition-all duration-300 ${settings.watermark.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
             
             {/* Mode Toggles */}
             <div className="flex bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm">
                <button
                    onClick={() => handleWatermarkChange('mode', 'text')}
                    className={`flex-1 text-xs py-3 font-medium rounded-lg transition-all ${settings.watermark.mode === 'text' ? 'bg-paper-dark text-ink-main shadow-inner' : 'text-ink-muted hover:text-ink-main'}`}
                >
                    Text
                </button>
                <button
                    onClick={() => handleWatermarkChange('mode', 'image')}
                    className={`flex-1 text-xs py-3 font-medium rounded-lg transition-all flex items-center justify-center gap-1 ${settings.watermark.mode === 'image' ? 'bg-paper-dark text-ink-main shadow-inner' : 'text-ink-muted hover:text-ink-main'}`}
                >
                    Logo
                    {!isPro && <Lock size={10} className="text-accent-gold" />}
                </button>
            </div>

            {settings.watermark.mode === 'text' ? (
                <div className="space-y-1">
                    <input
                        type="text"
                        value={settings.watermark.text}
                        onChange={(e) => handleWatermarkChange('text', e.target.value)}
                        className="w-full bg-white rounded-xl px-4 py-3 h-12 text-sm text-ink-main shadow-sm border border-gray-200 focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold transition-all placeholder:text-ink-muted/50"
                        placeholder="© Brand Name"
                    />
                </div>
            ) : (
                <div className="space-y-3 relative group">
                    {!isPro && (
                        <div 
                            className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[1px] rounded-xl flex items-center justify-center cursor-pointer"
                            onClick={onShowPaywall}
                        >
                            <span className="bg-ink-main text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-2">
                                <Lock size={12} /> Unlock Pro
                            </span>
                        </div>
                    )}
                    <label className={`
                        flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer bg-white transition-colors shadow-sm
                        ${isPro ? 'border-gray-200 hover:bg-gray-50' : 'border-gray-200'}
                    `}>
                        {settings.watermark.imageData ? (
                            <img src={settings.watermark.imageData} alt="Logo" className="h-full object-contain p-2" />
                        ) : (
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-8 h-8 text-gray-400 mb-3" />
                                <p className="text-xs text-gray-500 font-medium">Click to upload PNG</p>
                            </div>
                        )}
                        <input type="file" className="hidden" accept="image/png,image/jpeg" onChange={handleImageUpload} disabled={!isPro} />
                    </label>

                     <SynthSlider 
                        label="Logo Scale"
                        displayValue={`${Math.round(settings.watermark.scale * 100)}%`}
                        min="0.1"
                        max="1"
                        step="0.05"
                        value={settings.watermark.scale}
                        onChange={(e) => handleWatermarkChange('scale', parseFloat(e.target.value))}
                        disabled={!isPro}
                    />
                </div>
            )}

            {settings.watermark.mode === 'text' && (
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <label className="text-[10px] text-ink-muted font-bold uppercase block mb-3">Color</label>
                    <div className="relative w-full h-10 rounded-lg overflow-hidden border border-gray-100">
                        <input 
                        type="color" 
                        value={settings.watermark.color}
                        onChange={(e) => handleWatermarkChange('color', e.target.value)}
                        className="absolute -top-4 -left-4 w-[200%] h-[200%] cursor-pointer p-0 m-0"
                        />
                    </div>
                </div>
            )}
            
            <SynthSlider 
                label="Opacity"
                displayValue={`${Math.round(settings.watermark.opacity * 100)}%`}
                min="0"
                max="1"
                step="0.1"
                value={settings.watermark.opacity}
                onChange={(e) => handleWatermarkChange('opacity', parseFloat(e.target.value))}
            />

             <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <label className="text-[10px] text-ink-muted font-bold uppercase block mb-3">Position</label>
              <div className="grid grid-cols-3 gap-2">
                {['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'].map((pos) => {
                    const isCenter = pos === 'center';
                    const active = settings.watermark.position === pos;
                    return (
                        <button
                            key={pos}
                            onClick={() => handleWatermarkChange('position', pos)}
                            className={`
                                h-10 rounded-lg text-[10px] uppercase font-bold transition-all
                                ${active 
                                    ? 'bg-ink-main text-white shadow-md transform scale-105' 
                                    : 'bg-gray-50 text-ink-muted hover:bg-gray-100'}
                                ${isCenter ? 'col-span-3' : ''}
                            `}
                        >
                            {pos.replace('-', ' ')}
                        </button>
                    )
                })}
              </div>
            </div>
          </div>
        </AccordionItem>

        {/* Convert Module */}
        <AccordionItem
          title="Format"
          icon={Zap}
          isOpen={openSection === 'convert'}
          onToggle={() => toggleSection('convert')}
          active={true}
        >
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <label className="text-[10px] text-ink-muted font-bold uppercase block mb-3">Output Type</label>
              <div className="grid grid-cols-3 gap-2">
                  {Object.values(OutputFormat).map((fmt) => {
                      const label = fmt.split('/')[1].toUpperCase().replace('JPEG', 'JPG');
                      const active = settings.convert.format === fmt;
                      return (
                        <button
                            key={fmt}
                            onClick={() => handleConvertChange('format', fmt)}
                            className={`
                                py-3 rounded-lg text-xs font-bold border transition-all
                                ${active
                                    ? 'bg-white border-accent-gold text-accent-gold shadow-sm'
                                    : 'bg-gray-50 border-transparent text-ink-muted hover:bg-gray-100'}
                            `}
                        >
                            {label}
                        </button>
                      )
                  })}
              </div>
            </div>

            <SynthSlider 
                label="Quality"
                displayValue={`${Math.round(settings.convert.quality * 100)}%`}
                min="0.1"
                max="1"
                step="0.1"
                value={settings.convert.quality}
                onChange={(e) => handleConvertChange('quality', parseFloat(e.target.value))}
            />
          </div>
        </AccordionItem>
      </div>

       {/* Preset Upsell */}
      <div className="mt-6 pt-4 border-t border-gray-200 space-y-3">
        <button 
            onClick={onShowPaywall}
            className="w-full flex items-center gap-3 p-4 rounded-xl bg-white border border-gray-200 hover:border-accent-gold/50 transition-all cursor-pointer group text-left shadow-sm hover:shadow-md"
        >
            <div className="p-2 rounded-lg bg-accent-gold/10 text-accent-gold">
                <Lock size={16} />
            </div>
            <div>
                <h4 className="text-sm font-bold text-ink-main">Save Preset</h4>
                <p className="text-[10px] text-ink-muted group-hover:text-accent-gold transition-colors">Unlock Pro Workflow</p>
            </div>
        </button>

        <button
            onClick={onShowSecurity}
            className="w-full text-center text-[10px] text-ink-muted hover:text-ink-main flex items-center justify-center gap-1.5 transition-colors"
        >
            <Shield size={10} />
            How is this secure?
        </button>
      </div>
    </aside>
  );
};