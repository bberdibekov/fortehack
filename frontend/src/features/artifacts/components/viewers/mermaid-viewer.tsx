// src/features/artifacts/components/viewers/mermaid-viewer.tsx
import { useEffect, useRef, useState, useCallback } from 'react';
import mermaid from 'mermaid';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { ZoomIn, ZoomOut, RotateCcw, Download, AlertTriangle } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { useTheme } from '@/shared/components/theme-provider';
import * as styles from './styles/mermaid-viewer.styles';

interface MermaidViewerProps {
  content: string;
  title?: string;
}

export const MermaidViewer = ({ content, title }: MermaidViewerProps) => {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const renderChart = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      // 2. Define Theme Colors (Matching Shadcn Slate/Zinc)
      const isDark = theme === 'dark';

      const colors = {
        background: isDark ? '#1e293b' : '#ffffff',    // bg-slate-800 / white
        primary: isDark ? '#3b82f6' : '#2563eb',    // blue-500 / blue-600
        secondary: isDark ? '#334155' : '#f1f5f9',    // slate-700 / slate-100
        border: isDark ? '#475569' : '#cbd5e1',    // slate-600 / slate-300
        text: isDark ? '#f8fafc' : '#0f172a',    // slate-50 / slate-900
        line: isDark ? '#94a3b8' : '#64748b',    // slate-400 / slate-500
      };

      mermaid.initialize({
        startOnLoad: false,
        theme: 'base', // 'base' allows the most customization
        securityLevel: 'loose',
        fontFamily: 'Inter, sans-serif',

        // 3. THE MASTER CONFIG
        themeVariables: {
          darkMode: isDark,
          background: colors.background,

          // Fonts
          fontFamily: 'Inter, sans-serif',
          fontSize: '14px',

          // General Colors
          primaryColor: colors.secondary,     // Background of nodes
          primaryTextColor: colors.text,      // Text in nodes
          primaryBorderColor: colors.primary, // Border of nodes
          lineColor: colors.line,             // Arrows/Lines

          // Secondary (often used for alternate backgrounds)
          secondaryColor: colors.background,
          tertiaryColor: colors.background,

          // Specifics for Requirement Diagrams & Class Diagrams
          relationColor: colors.line,

          // Specifics for Sequence Diagrams
          actorBkg: colors.secondary,
          actorBorder: colors.primary,
          actorTextColor: colors.text,
          signalColor: colors.line,
          signalTextColor: colors.text,

          // Specifics for Flowcharts
          mainBkg: colors.background,
          nodeBorder: colors.primary,
          clusterBkg: isDark ? '#0f172a' : '#f8fafc', // Darker bg for subgraphs

          // Requirement Diagram Specifics (The one you asked about)
          reqBoxColor: colors.secondary,
          reqBorderColor: colors.primary,
          reqTextColor: colors.text,
        }
      });

      const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
      const { svg } = await mermaid.render(id, content);
      setSvg(svg);
      setError(null);
    } catch (err) {
      console.error("Mermaid Render Error:", err);
      setError("Failed to render diagram. Syntax might be invalid.");
    }



  }, [content, theme]);

  useEffect(() => {
    renderChart();
  }, [renderChart]);

  const handleDownload = () => {
    if (!svg) return;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'diagram'}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (error) {
    return (
      <div className={styles.ERROR_STATE_CLASSES}>
        <div className={styles.ERROR_ICON_WRAPPER_CLASSES}>
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h3 className="font-semibold mb-1">Diagram Render Failed</h3>
        <p className="text-sm text-muted-foreground mb-4">The mermaid syntax contains errors.</p>
        <pre className={styles.ERROR_CODE_BLOCK_CLASSES}>
          {content}
        </pre>
      </div>
    );
  }

  return (
    <div className={styles.VIEWER_WRAPPER_CLASSES}>
      {/* Inject global font overrides */}
      <style>{styles.GLOBAL_STYLES_INJECTION}</style>

      <TransformWrapper
        initialScale={1}
        minScale={0.05} // Increased Range: Zoom out to 5%
        maxScale={10}   // Increased Range: Zoom in to 1000%
        centerOnInit
        limitToBounds={false}
        wheel={{ step: 0.1 }} // Smooth scroll wheel
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            {/* Toolbar */}
            <div className={styles.TOOLBAR_CLASSES}>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md" onClick={() => zoomIn()} title="Zoom In">
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md" onClick={() => zoomOut()} title="Zoom Out">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md" onClick={() => resetTransform()} title="Reset View">
                <RotateCcw className="h-4 w-4" />
              </Button>
              <div className={styles.TOOLBAR_SEPARATOR_CLASSES} />
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md" onClick={handleDownload} title="Download SVG">
                <Download className="h-4 w-4" />
              </Button>
            </div>

            {/* Diagram Canvas */}
            <TransformComponent
              wrapperClass={styles.TRANSFORM_COMPONENT_WRAPPER_CLASSES}
              contentClass={styles.TRANSFORM_CONTENT_CLASSES}
              wrapperStyle={{ width: "100%", height: "100%" }} // Ensure full hit area
            >
              <div
                ref={containerRef}
                className={styles.MERMAID_RENDER_CONTAINER_CLASSES}
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </div>



  );
};