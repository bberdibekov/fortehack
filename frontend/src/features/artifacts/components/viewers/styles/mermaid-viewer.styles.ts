// src/features/artifacts/components/viewers/styles/mermaid-viewer.styles.ts

/**
 * Extracted styling constants for MermaidViewer.
 */

export const VIEWER_WRAPPER_CLASSES = 
    "h-full w-full flex flex-col bg-slate-50 dark:bg-slate-950/50 relative";

// 1. Global CSS styles injected for font consistency in the SVG output
export const GLOBAL_STYLES_INJECTION = `
  .mermaid svg { 
    font-family: 'Inter', ui-sans-serif, system-ui, sans-serif !important; 
  }
  .mermaid text, .mermaid tspan, .mermaid .label { 
    font-family: 'Inter', ui-sans-serif, system-ui, sans-serif !important; 
  }
`;

// 2. Toolbar layout
export const TOOLBAR_CLASSES = 
    "absolute bottom-4 right-4 z-10 flex gap-1 bg-background/95 backdrop-blur-sm p-1.5 rounded-lg border shadow-sm ring-1 ring-border/10";

export const TOOLBAR_SEPARATOR_CLASSES = "w-px h-4 bg-border my-auto mx-1";

// 3. Transform component wrappers
export const TRANSFORM_COMPONENT_WRAPPER_CLASSES = 
    "!w-full !h-full"; 

export const TRANSFORM_CONTENT_CLASSES = 
    "!w-full !h-full flex items-center justify-center p-12";

export const MERMAID_RENDER_CONTAINER_CLASSES = 
    "mermaid-output [&>svg]:max-w-full [&>svg]:h-auto [&>svg]:shadow-none";
    
// 4. Error state styling
export const ERROR_STATE_CLASSES = 
    "flex h-full flex-col items-center justify-center p-8 text-destructive text-center";

export const ERROR_ICON_WRAPPER_CLASSES = "mb-4 rounded-full bg-destructive/10 p-4";

export const ERROR_CODE_BLOCK_CLASSES = 
    "p-4 bg-muted/50 text-xs font-mono rounded border w-full max-w-md overflow-auto text-left whitespace-pre-wrap";