import { type UserStory, type WorkbookItem, type Artifact } from "@/core/api/types/generated";

// --- UI EXTENSIONS ---

// Artifacts in the store need 'isCollapsed'
export interface UIArtifact extends Artifact {
  isCollapsed?: boolean;
}

// User Stories in the viewer need editing state isNew?
export interface UIUserStory extends UserStory {
  isNew?: boolean; 
}

// Workbook Items need 'isNew' for auto-focus
export interface UIWorkbookItem extends WorkbookItem {
  isNew?: boolean;
}