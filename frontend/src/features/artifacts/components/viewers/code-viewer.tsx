// src/features/artifacts/components/viewers/code-viewer.tsx
import Editor, { loader } from '@monaco-editor/react';
import { useTheme } from "@/shared/components/theme-provider";
import * as styles from './styles/code-viewer.styles'; // <-- UPDATED IMPORT PATH

interface CodeViewerProps {
  content: string;
  language: string;
  readOnly?: boolean;
}

// Configure Monaco from CDN to avoid massive bundle size
loader.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' } });

export const CodeViewer = ({ content, language, readOnly = true }: CodeViewerProps) => {
  // Simple theme detection (mocked for now, defaults to dark vs-dark)
  const { theme } = useTheme();
  const editorTheme = theme === 'dark' ? 'vs-dark' : 'light';

  return (
    <div className={styles.CODE_VIEWER_WRAPPER_CLASSES}>
      <Editor
        height="100%"
        defaultLanguage={language || 'plaintext'}
        value={content}
        theme={editorTheme}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          padding: { top: 16 },
          scrollBeyondLastLine: false,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          smoothScrolling: true,
          cursorBlinking: 'smooth',
        }}
        loading={
          <div className={styles.CODE_VIEWER_LOADING_CLASSES}>
            Loading Editor...
          </div>
        }
      />
    </div>
  );
};