import React, { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon, Type, Zap, ChevronDown, ChevronRight, ChevronLeft, Lock, Upload, FileEdit, Check, X, Sliders, Play, RefreshCw, Save, PenTool, Trash2, Plus, Maximize2, Move, FileSignature } from 'lucide-react';
import { checkSubscriptionStatus } from '../utils/verification';
import { AppSettings, OutputFormat } from '../types';
import { RenameModule } from './RenameModule';
import { InfoTooltip } from './InfoTooltip';
import { PresetSelector } from './PresetSelector';
import { useStore } from '../store/useStore';
import { useToast } from './Toast';
import { DEFAULT_SETTINGS } from '../constants';
import { SignatureModule } from './SignatureModule';

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
  onPlacementStart?: () => void;
  onActiveViewChange?: (view: string) => void;
  activeView?: string;
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
      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${isOpen ? 'bg-gray-50' : 'hover:bg-gray-50'
        }`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg transition-colors ${active ? 'bg-ink-main text-white shadow-md' : 'bg-white text-ink-main border border-gray-100'
          }`}>
          <Icon size={16} strokeWidth={active ? 2.5 : 2} />
        </div>
        <span className={`text-sm font-bold ${active ? 'text-ink-main' : 'text-ink-muted'}`}>{title}</span>
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
        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 
        [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-ink-main 
        [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white
        [&::-webkit-slider-thumb]:shadow-md
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
  onAddMore,
  onPlacementStart,
  onActiveViewChange,
  activeView: propActiveView // Desctructure prop
}) => {
  // Use prop if available, otherwise local state (Uncontrolled Fallback)
  const [localActiveView, setLocalActiveView] = useState<'main' | 'resize' | 'rename' | 'signature' | 'watermark' | 'convert'>('main');

  const activeView = propActiveView || localActiveView;

  const handleToggleView = (view: typeof activeView) => {
    // If controlled, notify parent
    if (onActiveViewChange) {
      onActiveViewChange(activeView === view ? 'main' : view);
    }
    // If uncontrolled, update local state
    if (!propActiveView) {
      setLocalActiveView((prev) => (prev === view ? 'main' : view) as any);
    }
  };

  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [presetName, setPresetName] = useState('');

  const { addPreset, setSelectedPresetId } = useStore();
  const { showToast } = useToast();

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

  const MenuButton = ({ label, icon: Icon, onClick, active }: any) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200 group
      ${active ? 'border-accent-gold/30 bg-accent-gold/5 text-ink-main' : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm text-ink-muted hover:text-ink-main'}`}
    >
      <div className="flex items-center gap-3">
        <Icon size={18} strokeWidth={2} className={`transition-colors ${active ? 'text-accent-gold' : 'text-gray-400 group-hover:text-ink-main'}`} />
        <span className="font-semibold text-[15px] tracking-wide">{label}</span>
      </div>
      <ChevronRight size={16} className={`text-gray-300 group-hover:text-gray-400`} />
    </button>
  );

  const { setPro, user } = useStore();

  const handleStartClick = async () => {
    // SECURITY CHECK: Verify subscription status before running if in Pro mode
    if (isPro) {
      if (!user) {
        showToast("Session invalid. Please sign in.", "error");
        setPro(false);
        return;
      }

      // Silent verification
      const isValid = await checkSubscriptionStatus(user.id);
      if (!isValid) {
        setPro(false);
        showToast("Verification failed. Free mode restored.", "error");
        return; // HALT PROCESSING
      }
    }

    // If we get here, either free mode or verified pro
    onProcess();
  };

  // --- Smart Height Logic ---
  const sidebarRef = useRef<HTMLElement>(null);
  const [standardHeight, setStandardHeight] = useState<number>(0);

  useEffect(() => {
    if (activeView === 'main' && sidebarRef.current) {
      // Small delay to ensure render is complete
      const timer = setTimeout(() => {
        if (sidebarRef.current) {
          setStandardHeight(sidebarRef.current.offsetHeight);
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [activeView, settings]); // Re-measure if settings add/remove items

  return (
    <aside
      ref={sidebarRef}
      style={{ maxHeight: (activeView !== 'main' && standardHeight > 0) ? `${standardHeight}px` : '100%' }}
      className="
        w-full md:w-[360px] 
        h-fit max-h-full
        flex flex-col 
        bg-white/90 backdrop-blur-sm 
        md:rounded-2xl rounded-none md:shadow-2xl shadow-none 
        md:border border-l border-ink-muted/10 
        md:my-4 md:ml-4 m-0 
        overflow-hidden relative
    ">

      {/* 1. Fixed Header */}
      <div className="flex items-center justify-between px-6 py-5 bg-white/50 border-b border-gray-100 flex-none z-10">
        <div className="flex items-center gap-2 text-ink-main">
          {activeView !== 'main' ? (
            <button onClick={() => handleToggleView('main')} className="hover:bg-gray-100 p-1 -ml-2 rounded-lg transition-colors">
              <ChevronLeft size={20} />
            </button>
          ) : (
            <Sliders size={20} strokeWidth={2} />
          )}
          <span className="font-bold text-lg tracking-tight">
            {activeView === 'main' ? 'Studio Settings' :
              activeView === 'resize' ? 'Dimensions' :
                activeView === 'rename' ? 'Rename Files' :
                  activeView === 'signature' ? 'Digital Sign' :
                    activeView === 'watermark' ? 'Watermark' : 'Output Format'
            }
          </span>
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

      {/* 2. Content Area (Flex Scroll for Smart Constraints) */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar p-4 bg-white/30 relative min-h-0">

        {/* MAIN VIEW */}
        {activeView === 'main' && (
          <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
            <PresetSelector
              onSelect={(s) => updateSettings(s)}
              onReset={handleReset}
              isPro={isPro}
              onShowPaywall={onShowPaywall || (() => { })}
            />
            <div className="h-px w-full bg-gray-200/50 my-4" />

            <MenuButton label="Dimensions" icon={ImageIcon} active={settings.resize.enabled} onClick={() => handleToggleView('resize')} />
            <MenuButton label="Rename" icon={FileEdit} active={settings.rename.enabled} onClick={() => handleToggleView('rename')} />
            <MenuButton label="Sign" icon={PenTool} active={settings.signature.enabled} onClick={() => handleToggleView('signature')} />
            <MenuButton label="Watermark" icon={Type} active={settings.watermark.enabled} onClick={() => handleToggleView('watermark')} />
            <MenuButton label="Format" icon={Zap} active={true} onClick={() => handleToggleView('convert')} />
          </div>
        )}

        {/* DIMENSIONS VIEW */}
        {activeView === 'resize' && (
          <div className="animate-in slide-in-from-right-8 fade-in duration-300 space-y-6">
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center">
                <label className="text-sm text-ink-main font-bold">Enable Resize</label>
                <InfoTooltip content="Scale by percentage (50%) or set a fixed width. Aspect ratio is always preserved." />
              </div>
              <AppleToggle
                checked={settings.resize.enabled}
                onChange={(val) => handleResizeChange('enabled', val)}
              />
            </div>

            <div className={`space-y-6 transition-all duration-300 ${settings.resize.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              <div className="flex bg-gray-100/50 p-1.5 rounded-xl border border-gray-100">
                <button
                  onClick={() => handleResizeChange('type', 'percentage')}
                  className={`flex-1 text-xs py-2.5 font-bold rounded-lg transition-all ${settings.resize.type === 'percentage' ? 'bg-white text-ink-main shadow-sm' : 'text-ink-muted hover:text-ink-main'}`}
                >
                  Scale %
                </button>
                <button
                  onClick={() => handleResizeChange('type', 'width')}
                  className={`flex-1 text-xs py-2.5 font-bold rounded-lg transition-all ${settings.resize.type === 'width' ? 'bg-white text-ink-main shadow-sm' : 'text-ink-muted hover:text-ink-main'}`}
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
          </div>
        )}

        {/* RENAME VIEW */}
        {activeView === 'rename' && (
          <div className="animate-in slide-in-from-right-8 fade-in duration-300">
            <RenameModule
              settings={settings}
              updateSettings={updateSettings}
              isPro={isPro}
              onShowPaywall={onShowPaywall || (() => { })}
            />
          </div>
        )}

        {/* SIGNATURE VIEW */}
        {activeView === 'signature' && (
          <div className="animate-in slide-in-from-right-8 fade-in duration-300">
            <SignatureModule
              settings={settings}
              updateSettings={updateSettings}
              isPro={isPro}
              onShowPaywall={onShowPaywall}
              onPlacementStart={onPlacementStart}
            />


          </div>
        )}

        {/* WATERMARK VIEW */}
        {activeView === 'watermark' && (
          <div className="animate-in slide-in-from-right-8 fade-in duration-300 space-y-6">
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center">
                <label className="text-sm text-ink-main font-bold">Enable Watermark</label>
                <InfoTooltip content="Upload a PNG logo (Pro) or text. Use the grid or Custom Axis to position." />
              </div>
              <AppleToggle
                checked={settings.watermark.enabled}
                onChange={(val) => handleWatermarkChange('enabled', val)}
              />
            </div>

            <div className={`space-y-6 transition-all duration-300 ${settings.watermark.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              {/* Mode Toggles */}
              <div className="flex bg-gray-100/50 p-1.5 rounded-xl border border-gray-100">
                <button
                  onClick={() => handleWatermarkChange('mode', 'text')}
                  className={`flex-1 text-xs py-2.5 font-bold rounded-lg transition-all ${settings.watermark.mode === 'text' ? 'bg-white text-ink-main shadow-sm' : 'text-ink-muted hover:text-ink-main'}`}
                >
                  Text
                </button>
                <button
                  onClick={() => handleWatermarkChange('mode', 'image')}
                  className={`flex-1 text-xs py-2.5 font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${settings.watermark.mode === 'image' ? 'bg-white text-ink-main shadow-sm' : 'text-ink-muted hover:text-ink-main'}`}
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
                                flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer bg-white transition-colors
                                ${isPro ? 'border-gray-300 hover:bg-gray-50' : 'border-gray-200 opacity-60'}
                            `}>
                    {settings.watermark.imageData ? (
                      <img src={settings.watermark.imageData} alt="Logo" className="h-full object-contain p-4" />
                    ) : (
                      <div className="flex flex-col items-center justify-center pt-2 pb-3">
                        <Upload className="w-6 h-6 text-gray-400 mb-2" />
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
                <div className="grid grid-cols-3 gap-2 w-full max-w-[160px] mx-auto">
                  {positions.map((pos) => {
                    const active = settings.watermark.position === pos;
                    return (
                      <button
                        key={pos}
                        onClick={() => handleWatermarkChange('position', pos)}
                        className={`
                                        aspect-square rounded-md border flex items-center justify-center transition-all
                                        ${active ? 'bg-ink-main border-ink-main text-white shadow-md' : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'}
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
          </div>
        )}

        {/* FORMAT VIEW */}
        {activeView === 'convert' && (
          <div className="animate-in slide-in-from-right-8 fade-in duration-300 space-y-6">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <label className="text-xs text-ink-muted font-bold uppercase block mb-3">Output Type</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(OutputFormat).map((fmt) => {
                  const label = fmt.split('/')[1].toUpperCase().replace('JPEG', 'JPG');
                  const active = settings.convert.format === fmt;
                  return (
                    <button
                      key={fmt}
                      onClick={() => handleConvertChange('format', fmt)}
                      className={`
                                    py-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-2
                                    ${active ? 'bg-ink-main text-white border-ink-main shadow-md' : 'bg-gray-50 border-transparent text-ink-muted hover:bg-gray-100'}
                                `}
                    >
                      {label} {active && <Check size={12} />}
                    </button>
                  )
                })}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* 3. Footer (Fixed at bottom if content overflows, otherwise stacked) */}
      <div className="flex-none mt-0 px-4 pb-4 pt-4 bg-white/50 backdrop-blur-md border-t border-gray-100 z-10">


        {/* Quality Presets (Always Visible) */}
        {!settings.convert.format.includes('png') && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">Quality Preset</label>
              <span className="text-[10px] font-bold text-accent-gold">
                {settings.convert.quality <= 0.4 ? 'Small Size' :
                  settings.convert.quality >= 0.99 ? 'Best Quality' : 'Perfect Size'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Low', val: 0.2 },
                { label: 'Mid', val: 0.95 },
                { label: 'High', val: 1.0 }
              ].map((preset) => {
                let isActive = false;
                if (preset.label === 'Low') isActive = settings.convert.quality <= 0.4;
                else if (preset.label === 'High') isActive = settings.convert.quality >= 0.99;
                else isActive = settings.convert.quality > 0.4 && settings.convert.quality < 0.99;

                return (
                  <button
                    key={preset.label}
                    onClick={() => handleConvertChange('quality', preset.val)}
                    className={`
                        py-2.5 rounded-lg text-xs font-bold border transition-all duration-200
                        ${isActive
                        ? 'bg-ink-main text-white border-ink-main shadow-md transform scale-[1.02]'
                        : 'bg-white border-gray-200 text-ink-muted hover:bg-gray-50 hover:border-gray-300'}
                      `}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* PNG Warning */}
        {settings.convert.format.includes('png') && (
          <div className="mb-6 p-3 bg-blue-50/50 border border-blue-100 rounded-lg flex items-center justify-center gap-2">
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
            <span className="text-xs font-bold text-blue-600">PNG is Lossless (Max Quality)</span>
          </div>
        )}

        {/* Main Action Button */}
        <button
          onClick={handleStartClick}
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
                    ${isPro ? 'bg-white border-emerald-200 text-emerald-600 hover:bg-emerald-50' : 'border-gray-200 text-ink-muted hover:bg-gray-50'}
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