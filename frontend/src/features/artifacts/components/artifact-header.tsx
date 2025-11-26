import {
    Maximize2,
    Columns,
    X,
    Cloud,
    Loader2,
    AlertCircle
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { useUIStore } from '@/core/store/ui-store';
import { useArtifactStore } from '@/features/artifacts/stores/artifact-store';

interface ArtifactHeaderProps {
    isFullscreen: boolean;
}

export const ArtifactHeader = ({ isFullscreen }: ArtifactHeaderProps) => {
    const { setLayoutMode } = useUIStore();
    const { activeArtifactId, artifacts } = useArtifactStore();

    const activeArtifact = artifacts.find(a => a.id === activeArtifactId);
    const status = activeArtifact?.syncStatus || 'synced';
    const message = activeArtifact?.lastSyncMessage;

    // --- RENDER SYNC INDICATOR ---
    const renderSyncStatus = () => {
        if (!activeArtifact) return null;

        switch (status) {
            case 'saving':
            case 'processing':
                return (
                    <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-2 py-1 rounded-full animate-pulse border border-amber-200 dark:border-amber-800">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span className="font-medium">Saving...</span>
                    </div>
                );
            case 'synced':
                return (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground opacity-70 px-2 transition-opacity duration-500">
                        <Cloud className="h-3.5 w-3.5" />
                        <span>Synced</span>
                    </div>
                );
            case 'error':
                return (
                    <div className="flex items-center gap-1.5 text-xs text-destructive bg-destructive/10 px-2 py-1 rounded-full border border-destructive/20">
                        <AlertCircle className="h-3 w-3" />
                        <span className="font-medium">Save Failed</span>
                    </div>
                );
            default:
                return null;
        }



    };

    return (
        <div className="flex-none h-12 border-b flex items-center justify-between px-4 bg-muted/10">
            <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-muted-foreground">
                    Artifacts {isFullscreen ? '(Focus Mode)' : ''}
                </span>
                {/* Sync Indicator */}
                <div className="hidden md:block">
                    {renderSyncStatus()}
                </div>
            </div>

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
};