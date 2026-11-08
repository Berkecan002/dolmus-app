import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ThemeMode } from '../types/transport';

interface ThemeState {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
}

/**
 * DOM kök elemanında (`<html>`) Tailwind `dark` sınıfını günceller
 */
export function applyThemeToDom(theme: ThemeMode): void {
  if (typeof document === 'undefined') {
    return;
  }
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',

      toggleTheme: () => {
        const nextTheme: ThemeMode = get().theme === 'dark' ? 'light' : 'dark';
        applyThemeToDom(nextTheme);
        set({ theme: nextTheme });
      },

      setTheme: (theme: ThemeMode) => {
        applyThemeToDom(theme);
        set({ theme });
      },
    }),
    {
      name: 'dolmu-app-theme-v2',
      onRehydrateStorage: () => (state) => {
        if (state !== undefined) {
          applyThemeToDom(state.theme);
        }
      },
    }
  )
);
