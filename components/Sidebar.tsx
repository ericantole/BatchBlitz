import React, { useState } from 'react';
import { Image as ImageIcon, Type, Zap, ChevronDown, ChevronRight, Lock, Upload, Shield, FileEdit, Check, X, Sliders, Play, RefreshCw, Save, Plus } from 'lucide-react';
import { AppSettings, OutputFormat } from '../types';
import { RenameModule } from './RenameModule';
import { InfoTooltip } from './InfoTooltip';
import { PresetSelector } from './PresetSelector';
import { useStore } from '../store/useStore';
import { useToast } from './Toast';
import { DEFAULT_SETTINGS } from '../constants';

interface SidebarProps {
  settings: AppSettings;
  updateSettings: (newSettings: AppSettings) => void;
  isPro?: boolean;
  onShowPaywall?: () => void;
  onShowSecurity?: () => void;
  
  // State Machine Props
  onProcess: () => void;
  isProcessing: boolean;
  isDirty: boolean;
  hasImages: boolean;
  isCompleted: boolean;
  onAddMore?: () => void;
}

const AccordionItem: React.FC<{
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  active?: boolean;
}> = ({ title, icon: Icon, children, isOpen, onToggle, active }) => (
  <div className="mb-2 border-b border-gray-100 last:border-0 pb-2">
    <button
      onClick={onToggle}
      className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 
      ${active ? 'text-ink-main' : 'text-ink-muted hover:text-ink-main'}
      ${isOpen ? 'bg-black/[0.03]' : 'hover:bg-black/[0.02]'}`}
    >
      <div className="flex items-center gap-3">
        <Icon size={18} strokeWidth={2} className={active ? 'text-accent-gold' : 'text-ink-muted'} />
        <span className="font-semibold text-[15px] tracking-wide">{title}</span>
      </div>
      {isOpen ? <ChevronDown size={16} className="text-ink-muted" /> : <ChevronRight size={16} className="text-ink-muted" />}
    </button>
    {isOpen && <div className="p-2 pt-3 space-y-5 animate-in slide-in-from-top-1 duration-200">{children}</div>}
  </div>
);

// Apple-Style Toggle
const AppleToggle: React.FC<{ checked: boolean; onChange: (val: boolean) => void }> = ({ checked, onChange }) => (
  <button 
    onClick={() => onChange(!checked)}
    className={`w-10 h-6 rounded-full relative transition-colors duration-200 ease-in-out focus:outline-none ${checked ? 'bg-apple-green' : 'bg-gray-200'}`}
  >
    <span 
      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${checked ? 'translate-x-4' : 'translate-x-0'}`} 
    />
  </button>
);

// Custom styled range input
const SynthSlider: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string, displayValue: string }> = ({ label, displayValue, ...props }) => (
  <div className="space-y-3 group">
    <div className="flex justify-between text-xs font-medium text-ink-muted uppercase tracking-wider">
      <span>{label}</span>
      <span className="text-ink-main font-bold">{displayValue}</span>
    </div>
    <div className="relative h-4 flex items-center w-full">
      <input
        type="range"
        className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer focus:outline-none 
        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
        [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white 
        [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-gray-200
        [&::-webkit-slider-thumb]:shadow-sm
        [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110
        "
        {...props}
      />
    </div>
  </div>
);

export const Sidebar: React.FC<SidebarProps> = ({ 
    settings, 
    updateSettings, 
    isPro = false, 
    onShowPaywall, 
    onShowSecurity,
    onProcess,
    isProcessing,
    isDirty,
    hasImages,
    isCompleted,
    onAddMore
}) => {
  const [openSection, setOpenSection] = useState<string | null>('resize');
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [presetName, setPresetName] = useState('');
  
  const { addPreset, setSelectedPresetId } = useStore();
  const { showToast } = useToast();

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  // --- Handlers ---
  const handleResizeChange = (key: keyof typeof settings.resize, value: any) => {
    updateSettings({ ...settings, resize: { ...settings.resize, [key]: value } });
  };
  const handleWatermarkChange = (key: keyof typeof settings.watermark, value: any) => {
    updateSettings({ ...settings, watermark: { ...settings.watermark, [key]: value } });
  };
  const handleConvertChange = (key: keyof typeof settings.convert, value: any) => {
    updateSettings({ ...settings, convert: { ...settings.convert, [key]: value } });
  };

  const handleReset = () => {
      updateSettings(DEFAULT_SETTINGS);
      showToast('Settings reset to defaults', 'success');
  }

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

  const initiateSavePreset = () => {
      if (!isPro) return onShowPaywall?.();
      setIsSavingPreset(true);
  };

  const confirmSavePreset = () => {
      if (!presetName.trim()) return;
      const id = Math.random().toString(36).substring(2, 9);
      addPreset({
          id,
          name: presetName,
          settings: settings,
          createdAt: Date.now()
      });
      showToast('Preset saved successfully!', 'success');
      setIsSavingPreset(false);
      setPresetName('');
      setSelectedPresetId(id);
  };

  // --- Button State Machine Logic ---
  const getButtonState = () => {
      if (!hasImages) return { text: 'Add Images', disabled: true, variant: 'secondary' as const };
      if (isProcessing) return { text: 'Processing...', disabled: true, variant: 'secondary' as const, icon: RefreshCw, spin: true };
      
      if (isCompleted && !isDirty) {
          return { text: 'Processed', disabled: true, variant: 'glass' as const, icon: Check };
      }
      
      if (isCompleted && isDirty) {
          return { text: 'Apply Changes', disabled: false, variant: 'neon' as const, icon: RefreshCw };
      }
      
      // Default / Fresh
      return { text: 'Start Batch', disabled: false, variant: 'primary' as const, icon: Play };
  };

  const btnState = getButtonState();
  const BtnIcon = btnState.icon;

  const positions = [
    'top-left', 'top-center', 'top-right',
    'middle-left', 'center', 'middle-right',
    'bottom-left', 'bottom-center', 'bottom-right'
  ];

  return (
    <aside className="
        w-full md:w-auto h-fit max-h-[calc(100vh-32px)]
        flex flex-col 
        bg-white/90 backdrop-blur-sm 
        md:rounded-2xl rounded-none md:shadow-2xl shadow-none 
        md:border border-l border-ink-muted/10 
        md:m-4 m-0 
        overflow-y-auto no-scrollbar
    ">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 bg-white/50 border-b border-gray-100">
        <div className="flex items-center gap-2 text-ink-main">
          <Sliders size={20} strokeWidth={2} />
          <span className="font-bold text-lg tracking-tight">Studio Settings</span>
        </div>
        <div className="flex items-center gap-2">
            {!isPro && (
            <button 
                onClick={onShowPaywall}
                className="px-3 py-1 rounded-full border border-accent-gold/30 bg-accent-gold/5 text-accent-gold text-[10px] font-bold tracking-widest uppercase hover:bg-accent-gold hover:text-white transition-colors"
            >
                Upgrade
            </button>
            )}
        </div>
      </div>

      <div className="px-6 pb-6 pt-4">
        
        {/* Phase 1: Preset Control Bar */}
        <PresetSelector 
            onSelect={(s) => {
                updateSettings(s);
            }} 
            onReset={handleReset}
            isPro={isPro}
            onShowPaywall={onShowPaywall || (() => {})}
        />

        {/* Divider */}
        <div className="h-px w-full bg-gray-200 mb-6" />

        {/* Resize Module */}
        <AccordionItem
          title="Dimensions"
          icon={ImageIcon}
          isOpen={openSection === 'resize'}
          onToggle={() => toggleSection('resize')}
          active={settings.resize.enabled}
        >
          <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
            <div className="flex items-center">
                <label className="text-sm text-ink-main font-medium">Enable Resize</label>
                <InfoTooltip content="Scale by percentage (50%) or set a fixed width. Aspect ratio is always preserved." />
            </div>
            <AppleToggle 
              checked={settings.resize.enabled} 
              onChange={(val) => handleResizeChange('enabled', val)} 
            />
          </div>

          <div className={`space-y-4 transition-all duration-300 ${settings.resize.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => handleResizeChange('type', 'percentage')}
                className={`flex-1 text-xs py-2 font-bold rounded-md transition-all ${settings.resize.type === 'percentage' ? 'bg-white text-ink-main shadow-sm' : 'text-ink-muted hover:text-ink-main'}`}
              >
                Scale %
              </button>
              <button
                onClick={() => handleResizeChange('type', 'width')}
                className={`flex-1 text-xs py-2 font-bold rounded-md transition-all ${settings.resize.type === 'width' ? 'bg-white text-ink-main shadow-sm' : 'text-ink-muted hover:text-ink-main'}`}
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

        {/* Rename Module */}
        <AccordionItem
          title="Rename"
          icon={FileEdit}
          isOpen={openSection === 'rename'}
          onToggle={() => toggleSection('rename')}
          active={settings.rename?.enabled}
        >
          <RenameModule 
            settings={settings}
            updateSettings={updateSettings}
            isPro={isPro}
            onShowPaywall={onShowPaywall || (() => {})}
          />
        </AccordionItem>

        {/* Watermark Module */}
        <AccordionItem
          title="Watermark"
          icon={Type}
          isOpen={openSection === 'watermark'}
          onToggle={() => toggleSection('watermark')}
          active={settings.watermark.enabled}
        >
          <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
            <div className="flex items-center">
                <label className="text-sm text-ink-main font-medium">Enable Watermark</label>
                <InfoTooltip content="Upload a PNG logo (Pro) or text. Use the grid or Custom Axis to position." />
            </div>
            <AppleToggle 
              checked={settings.watermark.enabled} 
              onChange={(val) => handleWatermarkChange('enabled', val)} 
            />
          </div>

          <div className={`space-y-4 transition-all duration-300 ${settings.watermark.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
             
             {/* Mode Toggles */}
             <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                    onClick={() => handleWatermarkChange('mode', 'text')}
                    className={`flex-1 text-xs py-2 font-bold rounded-md transition-all ${settings.watermark.mode === 'text' ? 'bg-white text-ink-main shadow-sm' : 'text-ink-muted hover:text-ink-main'}`}
                >
                    Text
                </button>
                <button
                    onClick={() => handleWatermarkChange('mode', 'image')}
                    className={`flex-1 text-xs py-2 font-bold rounded-md transition-all flex items-center justify-center gap-1 ${settings.watermark.mode === 'image' ? 'bg-white text-ink-main shadow-sm' : 'text-ink-muted hover:text-ink-main'}`}
                >
                    Logo
                    {!isPro && <Lock size={12} className="text-accent-gold" />}
                </button>
            </div>

            {settings.watermark.mode === 'text' ? (
                <div className="space-y-1">
                    <input
                        type="text"
                        value={settings.watermark.text}
                        onChange={(e) => handleWatermarkChange('text', e.target.value)}
                        className="w-full bg-white rounded-lg px-3 py-2 text-sm text-ink-main shadow-sm border border-gray-200 focus:ring-1 focus:ring-accent-gold/20 focus:border-accent-gold transition-all placeholder:text-ink-muted/50"
                        placeholder="© Brand Name"
                    />
                </div>
            ) : (
                <div className="space-y-3 relative group">
                    <label className={`
                        flex flex-col items-center justify-center w-full h-24 border border-dashed rounded-lg cursor-pointer bg-white transition-colors
                        ${isPro ? 'border-gray-300 hover:bg-gray-50' : 'border-gray-200'}
                    `}>
                        {settings.watermark.imageData ? (
                            <img src={settings.watermark.imageData} alt="Logo" className="h-full object-contain p-2" />
                        ) : (
                            <div className="flex flex-col items-center justify-center pt-2 pb-3">
                                <Upload className="w-5 h-5 text-gray-400 mb-1" />
                                <p className="text-[10px] text-gray-500 font-medium">Click to upload PNG</p>
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
                <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                    <label className="text-xs text-ink-muted font-bold uppercase block mb-2">Color</label>
                    <div className="relative w-full h-8 rounded-md overflow-hidden border border-gray-100">
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

             <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
              <label className="text-xs text-ink-muted font-bold uppercase block mb-2">Position</label>
              
              {/* 3x3 Grid */}
              <div className="grid grid-cols-3 gap-2 w-full max-w-[160px] mx-auto">
                {positions.map((pos) => {
                    const active = settings.watermark.position === pos;
                    return (
                        <button
                            key={pos}
                            onClick={() => handleWatermarkChange('position', pos)}
                            className={`
                                aspect-square rounded-md border flex items-center justify-center transition-all
                                ${active 
                                    ? 'bg-ink-main border-ink-main text-white shadow-md' 
                                    : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'}
                            `}
                            title={pos.replace('-', ' ')}
                        >
                            <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-white' : 'bg-ink-muted/30'}`} />
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
            <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
              <label className="text-xs text-ink-muted font-bold uppercase block mb-2">Output Type</label>
              <div className="grid grid-cols-3 gap-1.5">
                  {Object.values(OutputFormat).map((fmt) => {
                      const label = fmt.split('/')[1].toUpperCase().replace('JPEG', 'JPG');
                      const active = settings.convert.format === fmt;
                      return (
                        <button
                            key={fmt}
                            onClick={() => handleConvertChange('format', fmt)}
                            className={`
                                py-2 rounded-md text-[10px] font-bold border transition-all
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

       {/* Footer: State Machine Button & Preset Save */}
      <div className="mt-6 px-6 pb-6">
        
        {/* Main Action Button (State Machine) */}
        <button
            onClick={onProcess}
            disabled={btnState.disabled}
            className={`
                hidden md:flex w-full py-4 rounded-xl items-center justify-center gap-2 font-bold text-sm tracking-wide shadow-lg mb-4 transition-all duration-300
                ${btnState.variant === 'primary' ? 'bg-ink-main text-white hover:-translate-y-0.5' : ''}
                ${btnState.variant === 'neon' ? 'bg-accent-gold text-white animate-pulse hover:animate-none' : ''}
                ${btnState.variant === 'secondary' ? 'bg-gray-200 text-ink-muted cursor-not-allowed' : ''}
                ${btnState.variant === 'glass' ? 'bg-green-100 text-green-700 border border-green-200 cursor-default' : ''}
            `}
        >
            {BtnIcon && <BtnIcon size={16} className={btnState.spin ? 'animate-spin' : ''} />}
            {btnState.text}
        </button>

        {isSavingPreset ? (
             <div className="bg-white p-3 rounded-xl border border-accent-gold/50 shadow-sm animate-in zoom-in-95 duration-200">
                <label className="text-[10px] font-bold text-accent-gold uppercase mb-1 block">Name workflow</label>
                <div className="flex gap-2">
                    <input 
                        autoFocus
                        type="text" 
                        value={presetName}
                        onChange={(e) => setPresetName(e.target.value)}
                        placeholder="e.g. Etsy Shop..."
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-ink-main focus:outline-none focus:ring-1 focus:ring-accent-gold/20 truncate"
                        onKeyDown={(e) => e.key === 'Enter' && confirmSavePreset()}
                    />
                    <button 
                        onClick={confirmSavePreset}
                        className="bg-accent-gold text-white rounded-lg p-1.5 hover:bg-yellow-600 transition-colors"
                    >
                        <Check size={14} />
                    </button>
                     <button 
                        onClick={() => setIsSavingPreset(false)}
                        className="bg-gray-100 text-ink-muted rounded-lg p-1.5 hover:bg-gray-200 transition-colors"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>
        ) : (
            <button 
                onClick={initiateSavePreset}
                className={`
                    w-full h-9 flex items-center justify-center gap-2 border rounded-lg text-xs font-bold uppercase tracking-wide transition-all
                    ${isPro 
                        ? 'bg-white border-emerald-200 text-emerald-600 hover:bg-emerald-50' 
                        : 'border-gray-200 text-ink-muted hover:bg-gray-50'}
                `}
            >
                {isPro ? <Save size={14} /> : <Lock size={14} />}
                {isPro ? 'Save Preset' : 'Unlock Presets'}
            </button>
        )}
      </div>
    </aside>
  );
};