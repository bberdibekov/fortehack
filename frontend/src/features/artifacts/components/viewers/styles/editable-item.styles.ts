// src/features/artifacts/components/viewers/workbook/styles/editable-item.styles.ts

/**
 * Extracted styling constants for EditableItem.
 */

// --- 1. EDIT MODE ---
export const EDIT_WRAPPER_CLASSES = "flex items-start gap-2 py-2 animate-in fade-in zoom-in-95 duration-200 w-full";
export const EDIT_TEXTAREA_CLASSES = 
    "min-h-[38px] resize-none overflow-hidden py-1.5 text-sm font-mono bg-background";

// --- 2. VIEW MODE: STANDARD ITEM ---
export const STANDARD_VIEW_WRAPPER_CLASSES = 
    "group flex items-start gap-2 py-2 hover:bg-muted/40 rounded-md px-2 -mx-2 transition-colors cursor-pointer";
export const DRAG_HANDLE_CLASSES = 
    "h-4 w-4 text-muted-foreground/20 mt-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab";
export const TEXT_CONTENT_CLASSES = 
    "flex-1 text-sm leading-relaxed break-words mt-0.5 flex gap-2";
export const DELETE_BUTTON_CLASSES = 
    "h-6 w-6 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive hover:bg-destructive/10";
export const WARNING_ICON_CLASSES = 
    "h-4 w-4 text-amber-500 shrink-0 mt-0.5";
export const TRASH_ICON_CLASSES = "h-3.5 w-3.5"; // Generic size for Trash icon

// --- 3. VIEW MODE: PROCESS FLOW ITEM ---
export const PROCESS_VIEW_WRAPPER_CLASSES = 
    "group relative py-4 pl-2 pr-8 hover:bg-muted/20 rounded-lg transition-colors border border-transparent hover:border-muted/50 my-2";
export const PROCESS_DRAG_HANDLE_CLASSES = 
    "absolute left-0 top-4 opacity-0 group-hover:opacity-100 cursor-grab";
export const PROCESS_HANDLE_ICON_CLASSES = "h-4 w-4 text-muted-foreground/40"; 
export const PROCESS_CONTENT_WRAPPER_CLASSES = 
    "flex flex-col items-center gap-1 ml-4 cursor-pointer";
export const PROCESS_STEP_BASE_CLASSES = 
    "px-4 py-2 rounded-lg text-sm font-medium border w-full text-center shadow-sm transition-all";
export const PROCESS_STEP_NORMAL_CLASSES = 
    "bg-background text-foreground border-border hover:border-primary/50";
export const PROCESS_STEP_EXCEPTION_CLASSES = 
    "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/30 dark:text-red-300 dark:border-red-900";
export const PROCESS_ARROW_CLASSES = 
    "h-4 w-4 text-muted-foreground/40 my-0.5";
export const PROCESS_DELETE_BUTTON_CLASSES = 
    "absolute top-2 right-2 h-6 w-6 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive";