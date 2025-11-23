import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type LayoutMode = 'chat' | 'split' | 'artifact';

interface UIState {
  sidebarOpen: boolean;
  layoutMode: LayoutMode;
  isSearchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  
  toggleSidebar: () => void;
  setLayoutMode: (mode: LayoutMode) => void;

}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      layoutMode: 'split', 
      isSearchOpen: false,
      setSearchOpen: (open) => set({ isSearchOpen: open }),
      
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setLayoutMode: (mode) => set({ layoutMode: mode }),
    }),
    {
      name: 'ui-storage',
    }
  )
);