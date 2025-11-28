// --- BASE STYLES ---
export const EDIT_WRAPPER_CLASSES = "w-full py-1";
export const EDIT_TEXTAREA_CLASSES = "min-h-[32px] w-full resize-none bg-transparent px-2 py-1 text-sm focus:bg-muted/30 focus:outline-none focus:ring-1 focus:ring-ring/30 rounded-md";

// --- VIEW MODES ---

// 1. STANDARD (Default)
export const STANDARD_WRAPPER_CLASSES = "group relative flex items-start gap-2 py-1.5 px-2 hover:bg-muted/40 rounded-md transition-colors border border-transparent hover:border-border/30";
export const TEXT_CONTENT_CLASSES = "flex-1 text-sm leading-relaxed cursor-text min-h-[20px]";

// 2. ACTOR (Persona Style)
export const ACTOR_WRAPPER_CLASSES = "group relative flex items-center gap-3 p-2 mb-2 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg shadow-sm hover:shadow-md transition-all hover:border-blue-200 dark:hover:border-blue-800";
export const ACTOR_AVATAR_CLASSES = "flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200 shrink-0";
export const ACTOR_TEXT_CLASSES = "flex-1 text-sm font-medium";

// 3. METRIC / KPI (Data Style)
export const METRIC_WRAPPER_CLASSES = "group relative flex items-center justify-between p-2 mb-2 bg-slate-50 dark:bg-slate-900/50 border-l-2 border-emerald-500 rounded-r-md hover:bg-emerald-50/20 transition-colors";
export const METRIC_TEXT_CLASSES = "flex-1 text-sm font-medium font-mono text-slate-700 dark:text-slate-200";

// 4. GOAL (Checklist Style)
export const GOAL_WRAPPER_CLASSES = "group relative flex items-start gap-3 py-2 px-2 border-b border-dashed border-slate-100 dark:border-slate-800 last:border-0 hover:bg-muted/20 rounded-sm";
export const GOAL_ICON_CLASSES = "h-4 w-4 text-green-500 mt-0.5 shrink-0";
export const GOAL_TEXT_CLASSES = "flex-1 text-sm";

// --- UTILS ---
export const DRAG_HANDLE_CLASSES = "h-4 w-4 text-muted-foreground/30 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity mt-0.5";
export const DELETE_BUTTON_CLASSES = "h-6 w-6 text-muted-foreground/0 group-hover:text-muted-foreground/50 hover:text-destructive transition-all opacity-0 group-hover:opacity-100";
export const TRASH_ICON_CLASSES = "h-3.5 w-3.5";

// Process Flow (Existing - kept for reference)
export const PROCESS_VIEW_WRAPPER_CLASSES = "group relative flex items-start gap-2 py-2 pl-2 pr-8 rounded-md hover:bg-muted/30 transition-colors border border-transparent hover:border-dashed hover:border-muted-foreground/20 my-1";
export const PROCESS_CONTENT_WRAPPER_CLASSES = "flex flex-wrap items-center gap-y-2 gap-x-1 flex-1 cursor-text";
export const PROCESS_STEP_BASE_CLASSES = "px-2.5 py-1 rounded-full text-xs font-medium border shadow-sm flex items-center transition-all";
export const PROCESS_STEP_NORMAL_CLASSES = "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300";
export const PROCESS_STEP_EXCEPTION_CLASSES = "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300";
export const PROCESS_ARROW_CLASSES = "h-3 w-3 text-slate-400 -rotate-90 sm:rotate-0";
export const PROCESS_DELETE_BUTTON_CLASSES = "absolute right-1 top-1.5 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive rounded-sm";
export const PROCESS_HANDLE_ICON_CLASSES = "h-3.5 w-3.5 text-muted-foreground/30 mt-1.5";
export const PROCESS_DRAG_HANDLE_CLASSES = "cursor-grab active:cursor-grabbing p-1";