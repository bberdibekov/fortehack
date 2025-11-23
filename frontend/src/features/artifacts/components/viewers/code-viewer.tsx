import Editor, { loader } from '@monaco-editor/react';
import { useTheme } from "@/shared/components/theme-provider";

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
    <div className="h-full w-full bg-[#1e1e1e]">
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
          <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm">
            Loading Editor...
          </div>
        }
      />
    </div>
  );
};