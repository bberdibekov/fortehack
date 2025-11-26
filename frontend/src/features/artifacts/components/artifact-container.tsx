import { useArtifactStore } from '@/features/artifacts/stores/artifact-store';
import { ArtifactTabBar } from './artifact-tab-bar';
import { ArtifactPlaceholder } from './artifact-placeholder';

// Viewers
import { CodeViewer } from './viewers/code-viewer';
import { HtmlViewer } from './viewers/html-viewer';
import { MermaidViewer } from './viewers/mermaid-viewer';
import { AnalystWorkbook } from './viewers/analyst-workbook';
import { UserStoryViewer } from './viewers/user-story-viewer';
import { DocumentViewer } from './viewers/document-viewer';

export const ArtifactContainer = () => {
  const { artifacts, activeArtifactId } = useArtifactStore();

  // Find the active artifact object
  const activeArtifact = artifacts.find(a => a.id === activeArtifactId);

  // 1. Render Logic
  const renderViewer = () => {
    if (!activeArtifact) return <ArtifactPlaceholder />;

    switch (activeArtifact.type) {
      case 'mermaid':
        return <MermaidViewer content={activeArtifact.content} title={activeArtifact.title} />;
      case 'workbook':
        return <AnalystWorkbook artifactId={activeArtifact.id} content={activeArtifact.content} />;
      case 'stories':
        return <UserStoryViewer artifactId={activeArtifact.id} content={activeArtifact.content} />;
      case 'html':
        return <HtmlViewer content={activeArtifact.content} title={activeArtifact.title} />;
      case 'code':
      case 'json':
        return <CodeViewer content={activeArtifact.content} language={activeArtifact.language || 'text'} />;
      case 'markdown':
        return <DocumentViewer content={activeArtifact.content} />;
      default:
        // Fallback for text
        return <CodeViewer content={activeArtifact.content} language="text" />;
    }
  };

  // 2. Empty State
  if (artifacts.length === 0) {
    return <ArtifactPlaceholder />;
  }

  // 3. Main Layout
  return (
    <div className="flex flex-col h-full w-full bg-background overflow-hidden">
      {/* A. Tab Bar */}
      <div className="flex-none z-20 bg-background">
        <ArtifactTabBar />
      </div>

      {/* B. Active Viewer Area */}
      <div className="flex-1 overflow-hidden relative">
        {renderViewer()}
      </div>
    </div>
  );
};