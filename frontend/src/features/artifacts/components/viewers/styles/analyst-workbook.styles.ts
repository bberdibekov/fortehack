// src/features/artifacts/components/viewers/styles/analyst-workbook.styles.ts (FINAL REVISION)

/**
 * Extracted styling constants for AnalystWorkbook container.
 */

export const WORKBOOK_WRAPPER_CLASSES =
    "h-full w-full bg-slate-50 dark:bg-slate-950/50 overflow-y-auto p-4 md:p-8 scrollbar-hide";

export const CONTENT_LAYOUT_CLASSES = "max-w-5xl mx-auto space-y-8";

// Header styling classes
export const HEADER_WRAPPER_CLASSES = "mb-6";
export const HEADER_TITLE_CLASSES = "text-2xl font-bold text-foreground tracking-tight";
export const HEADER_DESCRIPTION_CLASSES = "text-muted-foreground mt-1";

export const CATEGORY_GRID_CLASSES = "grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12";

// Error State Styles
export const ERROR_CONTAINER_CLASSES = 
    "flex flex-col items-center justify-center h-full text-destructive p-8 text-center bg-destructive/5";

export const ERROR_ICON_WRAPPER_CLASSES = "p-3 bg-destructive/10 rounded-full mb-3";

// NEW: Error heading and paragraph styles
export const ERROR_TITLE_CLASSES = "font-semibold text-lg mb-1";
export const ERROR_PARAGRAPH_CLASSES = "text-sm text-muted-foreground mb-4";


export const ERROR_CODE_BLOCK_CLASSES = 
    "w-full max-w-md bg-muted/50 p-4 rounded-md border text-left overflow-auto max-h-[200px]";

// NEW: Code element style inside the error block
export const ERROR_CODE_ELEMENT_CLASSES = "text-xs font-mono whitespace-pre-wrap";