import { useRef, useEffect } from 'react';
import { X, FileCode, Network, BookOpen, LayoutList, FileText } from 'lucide-react';
import { cn } from '@/shared/utils';
import { useArtifactStore } from '@/features/artifacts/stores/artifact-store';

export const ArtifactTabBar = () => {
  const { artifacts, activeArtifactId, setActiveArtifact, removeArtifact } = useArtifactStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active tab
  useEffect(() => {
    if (activeArtifactId && scrollRef.current) {
        const activeTab = document.getElementById(`tab-${activeArtifactId}`);
        if (activeTab) {
            activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }
  }, [activeArtifactId, artifacts.length]);

  if (artifacts.length === 0) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'mermaid': return <Network className="h-3.5 w-3.5 text-orange-500" />;
      case 'workbook': return <BookOpen className="h-3.5 w-3.5 text-blue-500" />;
      case 'stories': return <LayoutList className="h-3.5 w-3.5 text-emerald-500" />;
      case 'html': return <FileCode className="h-3.5 w-3.5 text-purple-500" />;
      default: return <FileText className="h-3.5 w-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="flex items-center w-full h-10 bg-muted/30 border-b">
      <div 
        ref={scrollRef}
        className="flex items-center overflow-x-auto scrollbar-hide h-full w-full px-1 gap-1"
      >
        {artifacts.map((artifact) => {
          const isActive = artifact.id === activeArtifactId;
          return (
            <div
              key={artifact.id}
              id={`tab-${artifact.id}`}
              onClick={() => setActiveArtifact(artifact.id)}
              className={cn(
                "group flex items-center gap-2 px-3 h-8 min-w-[140px] max-w-[200px] rounded-t-md border-t border-x text-xs font-medium cursor-pointer select-none transition-all relative top-[px]",
                isActive 
                  ? "bg-background border-border text-foreground z-10 shadow-sm" 
                  : "bg-transparent border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              {/* Icon */}
              <span className="shrink-0 opacity-80">{getIcon(artifact.type)}</span>
              
              {/* Title */}
              <span className="truncate flex-1">{artifact.title}</span>

              {/* Close Button (Visible on Hover or Active) */}
              <div 
                 onClick={(e) => {
                    e.stopPropagation();
                    removeArtifact(artifact.id);
                 }}
                 className={cn(
                    "rounded-sm p-0.5 hover:bg-muted-foreground/20 transition-opacity",
                    isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                 )}
              >
                <X className="h-3 w-3" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};