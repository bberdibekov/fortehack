import {
  type Artifact,
  type ArtifactSyncStatus,
  type UserStory,
  type WorkbookItem,
} from "@/core/api/types/generated";

// --- UI EXTENSIONS ---

export interface UIArtifact extends Artifact {
  isCollapsed?: boolean;
  syncStatus?: ArtifactSyncStatus;
  lastSyncMessage?: string;
}

export interface UIUserStory extends UserStory {
  isNew?: boolean;
}

export interface UIWorkbookItem extends WorkbookItem {
  isNew?: boolean;
}
