// src/features/artifacts/components/viewers/styles/user-story-viewer.styles.ts

/**
 * Extracted styling constants for UserStoryViewer and StoryCard.
 */

// --- 1. MAIN VIEWER CONTAINER ---
export const VIEWER_WRAPPER_CLASSES = 
    "h-full w-full bg-slate-50 dark:bg-slate-950/50 overflow-y-auto p-4 md:p-8 scrollbar-hide";
export const CONTENT_WRAPPER_CLASSES = "max-w-4xl mx-auto";
export const HEADER_CONTROLS_CLASSES = "mb-6 flex justify-between items-end";
export const VIEWER_TITLE_CLASSES = "text-2xl font-bold tracking-tight"; 
export const VIEWER_DESCRIPTION_CLASSES = "text-muted-foreground"; 
export const ADD_STORY_BUTTON_CLASSES = "shadow-sm";

// Error State Styles
export const ERROR_CONTAINER_CLASSES = 
    "flex flex-col items-center justify-center h-full text-destructive p-8 text-center bg-destructive/5";
export const ERROR_CODE_BLOCK_CLASSES = 
    "w-full max-w-md bg-muted/50 p-4 rounded-md border text-left overflow-auto max-h-[200px] mt-4";
export const ERROR_CODE_ELEMENT_CLASSES = "text-xs font-mono whitespace-pre-wrap";


// --- 2. ACCORDION / STORY CARD ---
export const ACCORDION_WRAPPER_CLASSES = "space-y-4";
export const ACCORDION_ITEM_CLASSES = 
    "border rounded-xl bg-card px-2 shadow-sm group/card transition-all hover:shadow-md";
export const ACCORDION_TRIGGER_CLASSES = 
    "px-4 hover:no-underline hover:bg-muted/20 rounded-lg flex-1 py-3";
export const TRIGGER_CONTENT_WRAPPER_CLASSES = 
    "flex flex-col md:flex-row md:items-center gap-4 text-left w-full pr-4";

// --- 3. STORY CARD HEADER ELEMENTS ---
export const HEADER_LEFT_CLASSES = "flex items-center gap-3 min-w-[140px]";
export const HEADER_ID_CLASSES = "font-mono text-xs text-muted-foreground font-bold shrink-0";
export const HEADER_SELECT_WRAPPER_CLASSES = "h-6";
export const HEADER_SELECT_TRIGGER_BASE_CLASSES = 
    "h-6 text-[10px] font-bold uppercase tracking-wider px-2 rounded-full border transition-colors w-[85px]";

export const HEADER_CENTER_CLASSES = "flex-1";
export const HEADER_BADGE_CONTAINER_CLASSES = "flex items-center gap-2 text-sm font-medium";
export const HEADER_BADGE_CLASSES = 
    "text-[10px] h-5 px-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0";
export const HEADER_SUMMARY_CLASSES = "text-foreground line-clamp-1";
export const USER_ICON_CLASSES = "h-3 w-3 mr-1"; 

export const HEADER_RIGHT_CLASSES = "hidden md:flex items-center gap-1 text-muted-foreground text-xs";
export const CLOCK_ICON_CLASSES = "h-3.5 w-3.5"; 

export const DELETE_BUTTON_WRAPPER_CLASSES = "flex items-center px-2 border-l my-3";
export const DELETE_BUTTON_CLASSES = 
    "h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg";
export const TRASH_ICON_HEADER_CLASSES = "h-4 w-4"; 

// --- 4. ACCORDION CONTENT ---
export const CONTENT_WRAPPER_CLASSES_INNER = "px-4 pb-6 pt-2";
export const CONTENT_ANIMATION_CLASSES = "space-y-6 animate-in slide-in-from-top-2 duration-200";

// Utility Icons (Target, CheckSquare, Ban)
export const ICON_MD_CLASSES = "h-4 w-4"; 
export const ICON_SM_CLASSES = "h-3.5 w-3.5"; 
export const LABEL_CLASSES = "text-[10px] uppercase font-bold text-muted-foreground block mb-1"; 

// Definition fields grid
export const DEFINITION_GRID_CLASSES = 
    "grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border rounded-lg bg-muted/10";

// Context/Description area
export const CONTEXT_AREA_CLASSES = 
    "grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-muted/30 rounded-lg";
export const CONTEXT_DESCRIPTION_WRAPPER_CLASSES = "md:col-span-2 space-y-2";
export const CONTEXT_QUOTE_CLASSES = 
    "mt-3 p-3 bg-background border rounded-md text-sm italic text-muted-foreground";
export const CONTEXT_QUOTE_EDITABLE_CLASSES =
    "inline-block not-italic font-semibold text-foreground border-b border-dotted border-muted-foreground/50 px-0 py-0 hover:bg-transparent min-w-[50px]";
export const CONTEXT_GOAL_WRAPPER_CLASSES = "space-y-2";

// Scope boundaries
export const SCOPE_GRID_CLASSES = "grid grid-cols-1 md:grid-cols-2 gap-6";
export const SCOPE_IN_CARD_CLASSES = 
    "p-4 border-emerald-100 dark:border-emerald-900/30 shadow-none bg-emerald-50/30 dark:bg-emerald-900/5";
export const SCOPE_IN_HEADER_CLASSES = 
    "text-xs font-bold uppercase text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-2";
export const SCOPE_OUT_CARD_CLASSES = 
    "p-4 border-rose-100 dark:border-rose-900/30 shadow-none bg-rose-50/30 dark:bg-rose-900/5";
export const SCOPE_OUT_HEADER_CLASSES = 
    "text-xs font-bold uppercase text-rose-700 dark:text-rose-400 mb-3 flex items-center gap-2";

// Acceptance Criteria
export const ACCEPTANCE_HEADER_CLASSES = 
    "text-xs font-semibold uppercase text-muted-foreground mb-3 flex items-center gap-2";

// --- 5. DYNAMIC PRIORITY STYLES (Used by getPriorityStyle) ---
export const PRIORITY_HIGH_CLASSES = 
    'text-red-700 bg-red-50 border-red-200 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
export const PRIORITY_MEDIUM_CLASSES = 
    'text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
export const PRIORITY_LOW_CLASSES = 
    'text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
export const PRIORITY_DEFAULT_CLASSES = 
    'text-muted-foreground bg-muted border-transparent';