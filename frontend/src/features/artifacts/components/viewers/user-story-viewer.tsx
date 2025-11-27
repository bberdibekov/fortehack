import { useState, useEffect } from 'react';
import { Accordion } from "@/shared/components/ui/accordion";
import { Button } from "@/shared/components/ui/button";
import { Plus } from 'lucide-react';

// Logic & State
import { useArtifactStore } from '@/features/artifacts/stores/artifact-store';
import { type UserStoryData, type UserStory } from '@/core/api/types/generated';
import { useChatSocket } from '@/shared/hooks/use-chat-socket'; 
import { useDebouncedCallback } from '@/shared/hooks/use-debounce';

// Sub-components
import { StoryCard } from './stories/story-card';
import * as styles from './styles/user-story-viewer.styles'; 

interface UserStoryViewerProps {
  artifactId: string;
  content: string;
}

export const UserStoryViewer = ({ artifactId, content }: UserStoryViewerProps) => {
  // Destructure setArtifactSyncStatus
  const { updateArtifactContent, setArtifactSyncStatus } = useArtifactStore();
  const { saveArtifact } = useChatSocket(); 
  
  const [data, setData] = useState<UserStoryData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 1. Debounced Save Logic
  // This prevents spamming the WebSocket with every keystroke.
  const debouncedSave = useDebouncedCallback((id: string, jsonString: string) => {
      // Optimistic Update: Tell the UI we are saving right now
      setArtifactSyncStatus(id, 'saving');
      
      // Send the payload
      saveArtifact(id, jsonString);
  }, 1000);

  // 2. Parse Content (Initial Load & External Updates)
  useEffect(() => {
    try {
      const parsed = JSON.parse(content);
      if (!parsed || !Array.isArray(parsed.stories)) {
         throw new Error("Missing 'stories' array");
      }
      setData(parsed);
      setError(null);
    } catch (e) {
      console.error("Story Parse Error", e);
      setError("Invalid JSON for User Stories");
    }
  }, [content]);

  // 3. Central Update Handler
  const handleUpdate = (newData: UserStoryData) => {
    // A. Immediate Local Update (Fast UI response)
    setData(newData);
    const jsonString = JSON.stringify(newData, null, 2);
    
    // B. Sync to Zustand Store (Keeps tabs consistent if switched)
    updateArtifactContent(artifactId, jsonString);

    // C. Sync to Backend (Debounced to save network/DB)
    debouncedSave(artifactId, jsonString);
  };

  // --- CRUD Actions ---

  const updateStory = (updatedStory: UserStory) => {
    if (!data) return;
    const newStories = data.stories.map(s => s.id === updatedStory.id ? updatedStory : s);
    handleUpdate({ ...data, stories: newStories });
  };

  const deleteStory = (id: string) => {
    if (!data || !confirm("Delete this user story?")) return;
    const newStories = data.stories.filter(s => s.id !== id);
    handleUpdate({ ...data, stories: newStories });
  };

  const addStory = () => {
    if (!data) return;
    const newId = `US-${data.stories.length + 101}`;
    
    // Default Template
    const newStory = {
      id: newId,
      priority: 'Medium',
      estimate: '?',
      role: 'User',
      action: 'do something',
      benefit: 'I get a benefit',
      description: 'New story description...',
      goal: 'Business Goal',
      scope: [],
      outOfScope: [],
      acceptanceCriteria: []
    } as UserStory;

    handleUpdate({ ...data, stories: [newStory, ...data.stories] });
  };

  // --- Render ---

  if (error) return (
    <div className={styles.ERROR_CONTAINER_CLASSES}>
        <h3 className="font-semibold text-lg mb-1">Failed to load Stories</h3>
        <p className="text-sm text-muted-foreground">{error}</p>
        <div className={styles.ERROR_CODE_BLOCK_CLASSES}>
            <code className={styles.ERROR_CODE_ELEMENT_CLASSES}>{content}</code>
        </div>
    </div>
  );

  if (!data) return null;

  return (
    <div className={styles.VIEWER_WRAPPER_CLASSES}>
      <div className={styles.CONTENT_WRAPPER_CLASSES}>
        
        {/* Header & Controls */}
        <div className={styles.HEADER_CONTROLS_CLASSES}>
          <div>
            <h1 className={styles.VIEWER_TITLE_CLASSES}>User Stories</h1>
            <p className={styles.VIEWER_DESCRIPTION_CLASSES}>Backlog, acceptance criteria, and scope.</p>
          </div>
          <Button onClick={addStory} size="sm" className={styles.ADD_STORY_BUTTON_CLASSES}>
            <Plus className="h-4 w-4 mr-2" /> Add Story
          </Button>
        </div>

        {/* Story List */}
        <Accordion type="single" collapsible className={styles.ACCORDION_WRAPPER_CLASSES}>
          {data.stories.map((story) => (
            <StoryCard 
                key={story.id} 
                story={story} 
                onUpdate={updateStory}
                onDelete={() => deleteStory(story.id)}
            />
          ))}
        </Accordion>
      </div>
    </div>
  );
};