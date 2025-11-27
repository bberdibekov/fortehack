// src/features/artifacts/components/viewers/styles/use-case-viewer.styles.ts

// Container
export const CONTAINER_CLASSES = "h-full w-full bg-slate-50 dark:bg-slate-900/50 p-6 md:p-8 overflow-y-auto scrollbar-hide";
export const WRAPPER_CLASSES = "max-w-4xl mx-auto space-y-6"; // Reduced vertical rhythm

// Card
export const CARD_CLASSES = "shadow-sm border-slate-200 dark:border-slate-800 transition-all hover:shadow-md bg-white dark:bg-slate-950 rounded-lg overflow-hidden";

// Header
export const CARD_HEADER_CLASSES = "bg-slate-50/50 dark:bg-slate-900/50 border-b p-5 pb-3"; 
export const CARD_TITLE_WRAPPER_CLASSES = "flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4";
export const TITLE_TEXT_CLASSES = "text-lg font-bold flex items-center gap-3 text-slate-900 dark:text-slate-100";
export const ID_BADGE_CLASSES = "text-muted-foreground font-mono text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-1.5 py-0.5 rounded shadow-sm";

// Actor Badge
export const ACTOR_BADGE_CLASSES = "w-fit gap-2 px-3 py-1.5 text-sm bg-white dark:bg-slate-900 border-blue-200 dark:border-blue-800 text-foreground shadow-sm";
export const ACTOR_ICON_CLASSES = "h-4 w-4 text-blue-500";

// Pre/Post Conditions
export const CONDITIONS_GRID_CLASSES = "grid grid-cols-1 md:grid-cols-2 gap-6 mt-2 pt-2";
export const CONDITION_HEADER_CLASSES = "text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-2";
export const CONDITION_LIST_CLASSES = "text-sm text-slate-600 dark:text-slate-300 space-y-2 pl-1";

// Main Flow Area
export const FLOW_CONTENT_CLASSES = "p-6 pt-6"; 
export const FLOW_HEADER_CLASSES = "text-xs font-bold uppercase tracking-wider text-muted-foreground mb-6 flex items-center gap-2";

// Flow Container (The "Subway Map")
export const FLOW_CONTAINER_CLASSES = "relative pl-2";

// Vertical Line Math:
// Circle is w-8 (32px). Center is 16px. Line is w-0.5 (2px).
// Left = 16px - 1px = 15px.
export const FLOW_VERTICAL_LINE_CLASSES = "absolute left-[15px] top-4 bottom-4 w-0.5 bg-slate-200 dark:bg-slate-800";

// Step Item
export const STEP_WRAPPER_CLASSES = "relative flex gap-5 group mb-8 last:mb-0"; // Increased gap for content separation

// Number Bubble
export const STEP_NUMBER_CIRCLE_CLASSES = "flex items-center justify-center w-8 h-8 rounded-full border-2 border-white dark:border-slate-950 bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-200 font-bold text-sm shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 z-10 relative bg-white";

// Step Text
export const STEP_TEXT_CLASSES = "text-sm leading-relaxed text-slate-800 dark:text-slate-200 pt-1.5 font-medium"; 

// Alternative Flow (Exception)
export const ALT_FLOW_WRAPPER_CLASSES = "mt-3 flex gap-3 animate-in fade-in slide-in-from-left-2";
export const ALT_FLOW_ICON_CLASSES = "h-4 w-4 text-amber-500 shrink-0 mt-2.5"; // Aligned with text
export const ALT_FLOW_BOX_CLASSES = "bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 rounded-md p-3 text-sm text-amber-900 dark:text-amber-100/90 w-full shadow-sm";
export const ALT_FLOW_LABEL_CLASSES = "font-bold text-amber-600 dark:text-amber-500 text-[10px] uppercase block mb-1 tracking-wide";