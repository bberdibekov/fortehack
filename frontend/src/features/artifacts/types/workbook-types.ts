export interface WorkbookItem {
  id: string;
  text: string;
  isNew?: boolean; // Helper for UI focus
}

export interface WorkbookCategory {
  id: string;
  title: string;
  color?: string; // e.g., "blue", "green" for visual distinction
  icon?: string;  // e.g., "target", "users"
  items: WorkbookItem[];
}

export interface WorkbookData {
  categories: WorkbookCategory[];
}