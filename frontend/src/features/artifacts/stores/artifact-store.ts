import { create } from 'zustand';
import { type UIArtifact } from '@/features/artifacts/types/ui-types';
import { type ArtifactSyncStatus } from '@/core/api/types/generated';

interface ArtifactState {
  artifacts: UIArtifact[];
  activeArtifactId: string | null;

  addArtifact: (artifact: UIArtifact) => void;
  updateArtifactContent: (id: string, content: string) => void;
  setArtifactSyncStatus: (
    id: string,
    status: ArtifactSyncStatus,
    message?: string,
  ) => void;
  removeArtifact: (id: string) => void;
  setActiveArtifact: (id: string) => void;
  reset: () => void;
}

export const useArtifactStore = create<ArtifactState>((set, get) => ({
  artifacts: [],
  activeArtifactId: null,

  addArtifact: (art) => {
    const { artifacts } = get();
    if (artifacts.some((a) => a.id === art.id)) {
      set({ activeArtifactId: art.id });
      return;
    }
    set({
      artifacts: [...artifacts, { ...art, syncStatus: "synced" }], // Default to synced
      activeArtifactId: art.id,
    });
  },

  updateArtifactContent: (id, content) =>
    set((state) => ({
      artifacts: state.artifacts.map((a) =>
        a.id === id ? { ...a, content } : a
      ),
    })),

  setArtifactSyncStatus: (id, status, message) =>
    set((state) => ({
      artifacts: state.artifacts.map((a) =>
        a.id === id ? { ...a, syncStatus: status, lastSyncMessage: message } : a
      ),
    })),

  setActiveArtifact: (id) => set({ activeArtifactId: id }),

  removeArtifact: (id) => {
    const { artifacts, activeArtifactId } = get();
    const newArtifacts = artifacts.filter((a) => a.id !== id);

    let newActiveId = activeArtifactId;
    if (activeArtifactId === id) {
      const index = artifacts.findIndex((a) => a.id === id);
      if (newArtifacts.length > 0) {
        const newIndex = index > 0 ? index - 1 : 0;
        newActiveId = newArtifacts[newIndex].id;
      } else {
        newActiveId = null;
      }
    }

    set({ artifacts: newArtifacts, activeArtifactId: newActiveId });
  },

  reset: () => set({ artifacts: [], activeArtifactId: null }),
}));
