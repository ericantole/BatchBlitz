import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '@supabase/supabase-js';
import { Preset } from '../types';

interface AppState {
  user: User | null;
  isPro: boolean;
  presets: Preset[];
  selectedPresetId: string; // 'default' or UUID
  setUser: (user: User | null) => void;
  setPro: (isPro: boolean) => void;
  togglePro: () => void;
  addPreset: (preset: Preset) => void;
  removePreset: (id: string) => void;
  setSelectedPresetId: (id: string) => void;
  reset: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      isPro: false,
      presets: [],
      selectedPresetId: 'default',
      setUser: (user) => set({ user }),
      setPro: (isPro) => set({ isPro }),
      togglePro: () => set((state) => ({ isPro: !state.isPro })),
      addPreset: (preset) => set((state) => ({ 
        presets: [...state.presets, preset] 
      })),
      removePreset: (id) => set((state) => ({ 
        presets: state.presets.filter((p) => p.id !== id) 
      })),
      setSelectedPresetId: (id) => set({ selectedPresetId: id }),
      reset: () => set({ user: null, isPro: false, presets: [], selectedPresetId: 'default' }),
    }),
    {
      name: 'batchblitz-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        presets: state.presets,
        isPro: state.isPro,
        selectedPresetId: state.selectedPresetId
      }),
    }
  )
);