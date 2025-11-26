import { create } from 'zustand';
import { type UIArtifact } from '@/features/artifacts/types/ui-types';

interface ArtifactState {
  artifacts: UIArtifact[];
  activeArtifactId: string | null;
  
  addArtifact: (artifact: UIArtifact) => void;
  updateArtifactContent: (id: string, content: string) => void;
  removeArtifact: (id: string) => void;
  setActiveArtifact: (id: string) => void;
  reset: () => void;
}

export const useArtifactStore = create<ArtifactState>((set, get) => ({
  artifacts: [],
  activeArtifactId: null,
  
  addArtifact: (art) => {
    const { artifacts } = get();
    // If already exists, just switch to it
    if (artifacts.some(a => a.id === art.id)) {
      set({ activeArtifactId: art.id });
      return;
    }
    // Add and switch
    set({ 
      artifacts: [...artifacts, art],
      activeArtifactId: art.id 
    });
  },

  updateArtifactContent: (id, content) => set((state) => ({
    artifacts: state.artifacts.map(a => a.id === id ? { ...a, content } : a)
  })),

  setActiveArtifact: (id) => set({ activeArtifactId: id }),

  removeArtifact: (id) => {
    const { artifacts, activeArtifactId } = get();
    const newArtifacts = artifacts.filter(a => a.id !== id);
    
    // If we closed the *active* tab, switch to another one
    let newActiveId = activeArtifactId;
    if (activeArtifactId === id) {
        // Try to go to the one to the left, or the one to the right, or null
        const index = artifacts.findIndex(a => a.id === id);
        if (newArtifacts.length > 0) {
            // If there is a previous one, go there. Else go to the next one (which is now at index)
            const newIndex = index > 0 ? index - 1 : 0;
            newActiveId = newArtifacts[newIndex].id;
        } else {
            newActiveId = null;
        }
    }

    set({ artifacts: newArtifacts, activeArtifactId: newActiveId });
  },

  reset: () => set({ artifacts: [], activeArtifactId: null })
}));