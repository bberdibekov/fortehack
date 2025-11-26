// src/features/artifacts/components/viewers/user-story-viewer.tsx
import { useState, useEffect } from 'react';
import { Accordion } from "@/shared/components/ui/accordion";
import { Button } from "@/shared/components/ui/button";
import { Plus } from 'lucide-react';

// Logic & State
import { useArtifactStore } from '@/features/artifacts/stores/artifact-store';
import { type UserStoryData, type UserStory } from '@/core/api/types/generated';
import { useChatSocket } from '@/shared/hooks/use-chat-socket'; 

// Sub-components
import { StoryCard } from './stories/story-card';
import * as styles from './styles/user-story-viewer.styles'; 

interface UserStoryViewerProps {
  artifactId: string;
  content: string;
}

export const UserStoryViewer = ({ artifactId, content }: UserStoryViewerProps) => {
  const { updateArtifactContent } = useArtifactStore();
  const { saveArtifact } = useChatSocket(); 
  const [data, setData] = useState<UserStoryData | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  // Sync Logic
  const handleUpdate = (newData: UserStoryData) => {
    setData(newData);
    const jsonString = JSON.stringify(newData, null, 2);
    updateArtifactContent(artifactId, jsonString);
    saveArtifact("stories", jsonString);
  };

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
        <div className={styles.HEADER_CONTROLS_CLASSES}>
          <div>
            <h1 className={styles.VIEWER_TITLE_CLASSES}>User Stories</h1>
            <p className={styles.VIEWER_DESCRIPTION_CLASSES}>Backlog, acceptance criteria, and scope.</p>
          </div>
          <Button onClick={addStory} size="sm" className={styles.ADD_STORY_BUTTON_CLASSES}>
            <Plus className="h-4 w-4 mr-2" /> Add Story
          </Button>
        </div>

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