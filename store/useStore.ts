import { create } from 'zustand';
import { User } from '@supabase/supabase-js';

interface AppState {
  user: User | null;
  isPro: boolean;
  setUser: (user: User | null) => void;
  setPro: (isPro: boolean) => void;
  reset: () => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  isPro: false,
  setUser: (user) => set({ user }),
  setPro: (isPro) => set({ isPro }),
  reset: () => set({ user: null, isPro: false }),
}));