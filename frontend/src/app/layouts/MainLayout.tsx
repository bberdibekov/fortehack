import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/shared/components/ui/resizable";
import { Sidebar } from '@/shared/components/layout/Sidebar';
import { useUIStore } from '@/core/store/ui-store';
import { 
  Maximize2, 
  Columns, 
  X 
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { ChatContainer } from '@/features/chat/components/chat-container';
import { ArtifactContainer } from '@/features/artifacts/components/artifact-container';
import { CommandMenu } from '@/shared/components/command-menu';

export const MainLayout = () => {
  const { layoutMode, setLayoutMode } = useUIStore();


  const ArtifactHeader = ({ isFullscreen }: { isFullscreen: boolean }) => (
    <div className="flex-none h-12 border-b flex items-center justify-between px-4 bg-muted/10">
      <span className="text-sm font-medium text-muted-foreground">
        Artifacts {isFullscreen ? '(Focus Mode)' : ''}
      </span>
      <div className="flex items-center gap-1">
        {isFullscreen ? (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8" 
            onClick={() => setLayoutMode('split')}
            title="Restore Split View"
          >
            <Columns className="h-4 w-4" />
          </Button>
        ) : (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8" 
            onClick={() => setLayoutMode('artifact')}
            title="Maximize Artifact"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        )}
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive" 
          onClick={() => setLayoutMode('chat')}
          title="Close Artifacts"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const OpenArtifactsButton = () => (
    <div className="absolute top-4 right-4 z-10 animate-in fade-in duration-300">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setLayoutMode('split')}
        className="shadow-sm bg-background/50 backdrop-blur-sm border-muted-foreground/20"
      >
        <Columns className="mr-2 h-4 w-4" />
        Open Artifacts
      </Button>
    </div>
  );

  // -- MAIN RENDER LOGIC --

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      
      {/* 1. Left Sidebar */}
      <div className="flex-none h-full z-20">
        <Sidebar />
      </div>

      {/* 2. Workspace Area */}
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        
        {/* STATE 1: CHAT ONLY */}
        {layoutMode === 'chat' && (
          <div className="flex-1 h-full w-full relative">
            <ChatContainer />
            <OpenArtifactsButton />
          </div>
        )}

        {/* STATE 2: SPLIT VIEW */}
        {layoutMode === 'split' && (
          <ResizablePanelGroup direction="horizontal" className="h-full w-full rounded-none border-0">
            <ResizablePanel defaultSize={50} minSize={20} className="h-full relative">
              <ChatContainer />
            </ResizablePanel>

            <ResizableHandle withHandle className="bg-border/50 w-1 hover:bg-primary/20 transition-colors" />

            <ResizablePanel defaultSize={50} minSize={20} className="h-full bg-background border-l flex flex-col">
               <ArtifactHeader isFullscreen={false} />
               <div className="flex-1 overflow-hidden relative">
                  <ArtifactContainer />
               </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}

        {/* STATE 3: ARTIFACT ONLY (FULLSCREEN) */}
        {layoutMode === 'artifact' && (
          <div className="flex-1 h-full w-full flex flex-col relative bg-background">
            <ArtifactHeader isFullscreen={true} />
            <div className="flex-1 overflow-hidden relative">
              <ArtifactContainer />
            </div>
          </div>
        )}

      </main>
      <CommandMenu />
    </div>
  );
};