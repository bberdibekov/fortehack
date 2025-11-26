// src/features/artifacts/components/viewers/html-viewer.tsx
import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import * as styles from './styles/html-viewer.styles'; // <-- UPDATED IMPORT PATH

interface HtmlViewerProps {
  content: string; // The HTML/JS string
  title?: string;
}

export const HtmlViewer = ({ content, title }: HtmlViewerProps) => {
  // const iframeRef = useRef<HTMLIFrameElement>(null);
  const [key, setKey] = useState(0); // Used to force reload

  // We inject a script to handle resizing and basic styling
  const bundledContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          body { background-color: transparent; padding: 20px; font-family: sans-serif; }
          /* Hide scrollbars if possible */
          ::-webkit-scrollbar { width: 8px; height: 8px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        </style>
      </head>
      <body>
        ${content}
      </body>
    </html>
  `;

  const handleReload = () => setKey(prev => prev + 1);

  return (
    <div className={styles.VIEWER_CONTAINER_CLASSES}>
      <div className={styles.TOOLBAR_CLASSES}>
        <span className="text-xs text-muted-foreground">Preview Mode</span>
        <Button variant="ghost" size="icon" onClick={handleReload} className="h-6 w-6">
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>
      
      <div className={styles.IFRAME_WRAPPER_CLASSES}>
        <iframe
          key={key}
          // ref={iframeRef}
          title={title || "Preview"}
          srcDoc={bundledContent}
          className={styles.IFRAME_CLASSES}
          sandbox="allow-scripts allow-popups allow-forms"
        />
      </div>
    </div>
  );
};