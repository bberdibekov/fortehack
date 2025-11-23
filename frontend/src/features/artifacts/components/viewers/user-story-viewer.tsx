import { useState, useEffect } from 'react';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/shared/components/ui/accordion";
import { Badge } from "@/shared/components/ui/badge";
import { Card } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/shared/components/ui/select";

import { 
  Target, 
  CheckSquare, 
  Ban, 
  Clock, 
  CheckCircle2, 
  User,
  Plus,
  Trash2
} from 'lucide-react';

// Logic & State
import { useArtifactStore } from '@/features/artifacts/stores/artifact-store';
import { type UserStoryData, type UserStory } from '../../types/user-story-types';
import { cn } from '@/shared/utils';

// Sub-components (Editors)
import { EditableText } from './stories/editable-text';
import { EditableList } from './stories/editable-list';

interface UserStoryViewerProps {
  artifactId: string;
  content: string;
}

// Helper for coloring the Priority Dropdown Trigger
const getPriorityStyle = (p: string) => {
  switch(p?.toLowerCase()) {
    case 'high': return 'text-red-700 bg-red-50 border-red-200 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
    case 'medium': return 'text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
    case 'low': return 'text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
    default: return 'text-muted-foreground bg-muted border-transparent';
  }
};

export const UserStoryViewer = ({ artifactId, content }: UserStoryViewerProps) => {
  const { updateArtifactContent } = useArtifactStore();
  const [data, setData] = useState<UserStoryData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 1. Parse Content
  useEffect(() => {
    try {
      const parsed = JSON.parse(content);
      setData(parsed);
      setError(null);
    } catch (e) {
      setError("Invalid JSON for User Stories");
    }
  }, [content]);

  // 2. Sync Logic (Save to Store)
  const handleUpdate = (newData: UserStoryData) => {
    setData(newData);
    updateArtifactContent(artifactId, JSON.stringify(newData, null, 2));
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
    const newStory: UserStory = {
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
    };
    handleUpdate({ ...data, stories: [newStory, ...data.stories] }); // Add to top
  };

  if (error) return <div className="p-8 text-destructive">{error}</div>;
  if (!data) return null;

  return (
    <div className="h-full w-full bg-slate-50 dark:bg-slate-950/50 overflow-y-auto p-4 md:p-8 scrollbar-hide">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">User Stories</h1>
            <p className="text-muted-foreground">Backlog, acceptance criteria, and scope.</p>
          </div>
          <Button onClick={addStory} size="sm" className="shadow-sm">
            <Plus className="h-4 w-4 mr-2" /> Add Story
          </Button>
        </div>

        {/* List */}
        <Accordion type="single" collapsible className="space-y-4">
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

// --- Individual Story Component ---

interface StoryCardProps {
    story: UserStory;
    onUpdate: (s: UserStory) => void;
    onDelete: () => void;
}

const StoryCard = ({ story, onUpdate, onDelete }: StoryCardProps) => {
  return (
    <AccordionItem value={story.id} className="border rounded-xl bg-card px-2 shadow-sm group/card transition-all hover:shadow-md">
      <div className="flex w-full">
        <AccordionTrigger className="px-4 hover:no-underline hover:bg-muted/20 rounded-lg flex-1 py-3">
            <div className="flex flex-col md:flex-row md:items-center gap-4 text-left w-full pr-4">
            
            {/* Header Left: ID & Priority */}
            <div className="flex items-center gap-3 min-w-[140px]">
                <span className="font-mono text-xs text-muted-foreground font-bold shrink-0">{story.id}</span>
                
                {/* STOP PROPAGATION: Prevents accordion toggle when clicking dropdown */}
                <div onClick={(e) => e.stopPropagation()} className="h-6">
                  <Select 
                    value={story.priority} 
                    onValueChange={(val: any) => onUpdate({...story, priority: val})}
                  >
                    <SelectTrigger className={cn(
                      "h-6 text-[10px] font-bold uppercase tracking-wider px-2 rounded-full border transition-colors w-[85px]", 
                      getPriorityStyle(story.priority)
                    )}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High" className="text-red-600 text-xs font-medium">High</SelectItem>
                      <SelectItem value="Medium" className="text-amber-600 text-xs font-medium">Medium</SelectItem>
                      <SelectItem value="Low" className="text-blue-600 text-xs font-medium">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
            </div>

            {/* Header Center: Summary */}
            <div className="flex-1">
                <div className="flex items-center gap-2 text-sm font-medium">
                    <Badge variant="secondary" className="text-[10px] h-5 px-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                    <User className="h-3 w-3 mr-1" />
                    {story.role}
                    </Badge>
                    <span className="text-foreground line-clamp-1">
                    {story.action}
                    </span>
                </div>
            </div>

            {/* Header Right: Estimate */}
            <div className="hidden md:flex items-center gap-1 text-muted-foreground text-xs">
                <Clock className="h-3.5 w-3.5" />
                <span>{story.estimate}</span>
            </div>

            </div>
        </AccordionTrigger>
        
        {/* Delete Story Button (Outside Trigger) */}
        <div className="flex items-center px-2 border-l my-3">
             <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg" 
                onClick={onDelete}
                title="Delete Story"
             >
                 <Trash2 className="h-4 w-4" />
             </Button>
        </div>
      </div>
      
      <AccordionContent className="px-4 pb-6 pt-2">
        <div className="space-y-6 animate-in slide-in-from-top-2 duration-200">
           
           {/* 1. Definition Fields Grid */}
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border rounded-lg bg-muted/10">
               <div>
                   <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Role</label>
                   <EditableText value={story.role} onSave={(v) => onUpdate({...story, role: v})} />
               </div>
               <div className="md:col-span-2">
                   <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Action</label>
                   <EditableText value={story.action} onSave={(v) => onUpdate({...story, action: v})} />
               </div>
               <div>
                   <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Estimate</label>
                   <EditableText value={story.estimate} onSave={(v) => onUpdate({...story, estimate: v})} />
               </div>
           </div>

           {/* 2. Context & Description */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-muted/30 rounded-lg">
              <div className="md:col-span-2 space-y-2">
                 <h4 className="text-xs font-semibold uppercase text-muted-foreground">Context & Description</h4>
                 <EditableText 
                    multiline 
                    className="text-sm leading-relaxed" 
                    value={story.description} 
                    onSave={(v) => onUpdate({...story, description: v})} 
                 />
                 
                 <div className="mt-3 p-3 bg-background border rounded-md text-sm italic text-muted-foreground">
                    "As a <strong className="text-foreground">{story.role}</strong>, I want to <strong className="text-foreground">{story.action}</strong>, so that..."
                    <EditableText 
                        className="inline-block not-italic font-semibold text-foreground border-b border-dotted border-muted-foreground/50 px-0 py-0 hover:bg-transparent min-w-[50px]" 
                        value={story.benefit} 
                        onSave={(v) => onUpdate({...story, benefit: v})} 
                    />
                 </div>
              </div>
              <div className="space-y-2">
                 <h4 className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1">
                    <Target className="h-3.5 w-3.5" /> Business Goal
                 </h4>
                 <EditableText 
                    value={story.goal} 
                    onSave={(v) => onUpdate({...story, goal: v})} 
                    className="font-medium"
                 />
              </div>
           </div>

           {/* 3. Scope Boundaries */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-4 border-emerald-100 dark:border-emerald-900/30 shadow-none bg-emerald-50/30 dark:bg-emerald-900/5">
                 <h4 className="text-xs font-bold uppercase text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" /> In Scope
                 </h4>
                 <EditableList 
                    items={story.scope} 
                    onUpdate={(newItems) => onUpdate({...story, scope: newItems})} 
                 />
              </Card>

              <Card className="p-4 border-rose-100 dark:border-rose-900/30 shadow-none bg-rose-50/30 dark:bg-rose-900/5">
                 <h4 className="text-xs font-bold uppercase text-rose-700 dark:text-rose-400 mb-3 flex items-center gap-2">
                    <Ban className="h-4 w-4" /> Out of Scope
                 </h4>
                 <EditableList 
                    items={story.outOfScope} 
                    onUpdate={(newItems) => onUpdate({...story, outOfScope: newItems})} 
                 />
              </Card>
           </div>

           {/* 4. Acceptance Criteria */}
           <div>
              <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3 flex items-center gap-2">
                 <CheckSquare className="h-3.5 w-3.5" /> Acceptance Criteria
              </h4>
              <EditableList 
                items={story.acceptanceCriteria} 
                onUpdate={(newItems) => onUpdate({...story, acceptanceCriteria: newItems})} 
              />
           </div>

        </div>
      </AccordionContent>
    </AccordionItem>
  );
};