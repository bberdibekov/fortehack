// src/features/artifacts/components/viewers/stories/story-card.tsx
import { 
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
import { GlossaryLabel } from '@/shared/components/glossary-label';
import { 
  Target, 
  CheckSquare, 
  Ban, 
  Clock, 
  CheckCircle2, 
  User,
  Trash2
} from 'lucide-react';
import { cn } from '@/shared/utils';
import { type UserStory } from '@/core/api/types/generated';
import { EditableText } from './editable-text';
import { EditableList } from './editable-list';
import * as styles from '../styles/user-story-viewer.styles'; // Correct relative import to styles

interface StoryCardProps {
    story: UserStory;
    onUpdate: (s: UserStory) => void;
    onDelete: () => void;
}

const getPriorityStyle = (p: string) => {
  switch(p?.toLowerCase()) {
    case 'high': return styles.PRIORITY_HIGH_CLASSES;
    case 'medium': return styles.PRIORITY_MEDIUM_CLASSES;
    case 'low': return styles.PRIORITY_LOW_CLASSES;
    default: return styles.PRIORITY_DEFAULT_CLASSES;
  }
};

export const StoryCard = ({ story, onUpdate, onDelete }: StoryCardProps) => {
  return (
    <AccordionItem value={story.id} className={styles.ACCORDION_ITEM_CLASSES}>
      <div className="flex w-full">
        <AccordionTrigger className={styles.ACCORDION_TRIGGER_CLASSES}>
            <div className={styles.TRIGGER_CONTENT_WRAPPER_CLASSES}>
            
            {/* Header Left: ID & Priority */}
            <div className={styles.HEADER_LEFT_CLASSES}>
                <span className={styles.HEADER_ID_CLASSES}>{story.id}</span>
                
                {/* STOP PROPAGATION: Prevents accordion toggle when clicking dropdown */}
                <div onClick={(e) => e.stopPropagation()} className={styles.HEADER_SELECT_WRAPPER_CLASSES}>
                  <Select 
                    value={story.priority} 
                    onValueChange={(val: any) => onUpdate({...story, priority: val})}
                  >
                    <SelectTrigger className={cn(
                      styles.HEADER_SELECT_TRIGGER_BASE_CLASSES, 
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
            <div className={styles.HEADER_CENTER_CLASSES}>
                <div className={styles.HEADER_BADGE_CONTAINER_CLASSES}>
                    <Badge variant="secondary" className={styles.HEADER_BADGE_CLASSES}>
                    <User className={styles.USER_ICON_CLASSES} />
                    {story.role}
                    </Badge>
                    <span className={styles.HEADER_SUMMARY_CLASSES}>
                    {story.action}
                    </span>
                </div>
            </div>

            {/* Header Right: Estimate */}
            <div className={styles.HEADER_RIGHT_CLASSES}>
                <Clock className={styles.CLOCK_ICON_CLASSES} />
                <span>{story.estimate}</span>
            </div>

            </div>
        </AccordionTrigger>
        
        {/* Delete Story Button (Outside Trigger) */}
        <div className={styles.DELETE_BUTTON_WRAPPER_CLASSES}>
             <Button 
                variant="ghost" 
                size="icon" 
                className={styles.DELETE_BUTTON_CLASSES} 
                onClick={onDelete}
                title="Delete Story"
             >
                 <Trash2 className={styles.TRASH_ICON_HEADER_CLASSES} />
             </Button>
        </div>
      </div>
      
      <AccordionContent className={styles.CONTENT_WRAPPER_CLASSES_INNER}>
        <div className={styles.CONTENT_ANIMATION_CLASSES}>
           
           {/* 1. Definition Fields Grid */}
           <div className={styles.DEFINITION_GRID_CLASSES}>
               <div>
                   <label className={styles.LABEL_CLASSES}>Role</label>
                   <EditableText value={story.role} onSave={(v) => onUpdate({...story, role: v})} />
               </div>
               <div className="md:col-span-2">
                   <label className={styles.LABEL_CLASSES}>Action</label>
                   <EditableText value={story.action} onSave={(v) => onUpdate({...story, action: v})} />
               </div>
               <div>
                   <label className={styles.LABEL_CLASSES}>
                      {/* Integrated Glossary Tooltip */}
                      <GlossaryLabel term="estimate">Estimate</GlossaryLabel>
                   </label>
                   <EditableText value={story.estimate} onSave={(v) => onUpdate({...story, estimate: v})} />
               </div>
           </div>

           {/* 2. Context & Description */}
           <div className={styles.CONTEXT_AREA_CLASSES}>
              <div className={styles.CONTEXT_DESCRIPTION_WRAPPER_CLASSES}>
                 <h4 className="text-xs font-semibold uppercase text-muted-foreground">Context & Description</h4>
                 <EditableText 
                    multiline 
                    className="text-sm leading-relaxed" 
                    value={story.description|| ""} 
                    onSave={(v) => onUpdate({...story, description: v})} 
                 />
                 
                 <div className={styles.CONTEXT_QUOTE_CLASSES}>
                    "As a <strong className="text-foreground">{story.role}</strong>, I want to <strong className="text-foreground">{story.action}</strong>, so that..."
                    <EditableText 
                        className={styles.CONTEXT_QUOTE_EDITABLE_CLASSES} 
                        value={story.benefit} 
                        onSave={(v) => onUpdate({...story, benefit: v})} 
                    />
                 </div>
              </div>
              <div className={styles.CONTEXT_GOAL_WRAPPER_CLASSES}>
                 <h4 className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1">
                    <Target className={styles.ICON_SM_CLASSES} /> 
                    <GlossaryLabel term="goal">Business Goal</GlossaryLabel>
                 </h4>
                 <EditableText 
                    value={story.goal|| ""} 
                    onSave={(v) => onUpdate({...story, goal: v})} 
                    className="font-medium"
                 />
              </div>
           </div>

           {/* 3. Scope Boundaries */}
           <div className={styles.SCOPE_GRID_CLASSES}>
              <Card className={styles.SCOPE_IN_CARD_CLASSES}>
                 <h4 className={styles.SCOPE_IN_HEADER_CLASSES}>
                    <CheckCircle2 className={styles.ICON_MD_CLASSES} /> 
                    <GlossaryLabel term="scope">In Scope</GlossaryLabel>
                 </h4>
                 <EditableList 
                    items={story.scope} 
                    onUpdate={(newItems) => onUpdate({...story, scope: newItems})} 
                 />
              </Card>

              <Card className={styles.SCOPE_OUT_CARD_CLASSES}>
                 <h4 className={styles.SCOPE_OUT_HEADER_CLASSES}>
                    <Ban className={styles.ICON_MD_CLASSES} /> Out of Scope
                 </h4>
                 <EditableList 
                    items={story.outOfScope} 
                    onUpdate={(newItems) => onUpdate({...story, outOfScope: newItems})} 
                 />
              </Card>
           </div>

           {/* 4. Acceptance Criteria */}
           <div>
              <h4 className={styles.ACCEPTANCE_HEADER_CLASSES}>
                 <CheckSquare className={styles.ICON_SM_CLASSES} /> 
                 <GlossaryLabel term="acceptance criteria">Acceptance Criteria</GlossaryLabel>
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