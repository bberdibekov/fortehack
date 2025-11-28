import React, { useState, useRef, useEffect } from 'react';
import { Trash2, GripVertical, ArrowRight, User, CheckCircle2, TrendingUp } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { cn } from '@/shared/utils';
import * as styles from '../styles/editable-item.styles';

export type ItemVariant = 'default' | 'actor' | 'metric' | 'goal' | 'process';

export interface EditableItemProps {
  value: string;
  onSave: (val: string) => void;
  onDelete: () => void;
  isNew?: boolean;
  variant?: ItemVariant;
}

export const EditableItem = ({ 
  value, 
  onSave, 
  onDelete, 
  isNew, 
  variant = 'default' 
}: EditableItemProps) => {
  const [isEditing, setIsEditing] = useState(isNew);
  const [tempValue, setTempValue] = useState(value);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isNew && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isNew]);

  const handleSave = () => {
    if (tempValue.trim() === '') {
      onDelete(); 
    } else {
      onSave(tempValue);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  // --- NEW: CONTENT RENDERER ---
  // Detects "Key: Value" pattern and bolds the Key
  const renderContent = (text: string) => {
    const parts = text.split(':');
    
    // If we have a colon and it's not a URL (http://)
    if (parts.length > 1 && !text.includes('//')) {
      const key = parts[0];
      // Rejoin the rest in case the value has colons too
      const val = parts.slice(1).join(':'); 
      
      return (
        <span>
          <span className="font-semibold text-foreground/90">{key}:</span>
          <span className="text-muted-foreground">{val}</span>
        </span>
      );
    }
    
    // Fallback for regular text
    return <span>{text}</span>;
  };

  if (isEditing) {
    return (
      <div className={styles.EDIT_WRAPPER_CLASSES}>
        <Textarea
          ref={inputRef}
          value={tempValue}
          onChange={(e) => {
             setTempValue(e.target.value);
             e.target.style.height = 'auto';
             e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className={styles.EDIT_TEXTAREA_CLASSES}
          rows={1}
        />
      </div>
    );
  }

  // VIEW MODES

  // 1. PROCESS FLOW (Ignores colon logic, uses arrows)
  if (variant === 'process' || value.includes('->')) {
    const steps = value.split('->').map(s => s.trim());
    return (
      <div className={styles.PROCESS_VIEW_WRAPPER_CLASSES}>
        <div className={styles.PROCESS_DRAG_HANDLE_CLASSES}>
           <GripVertical className={styles.PROCESS_HANDLE_ICON_CLASSES} />
        </div>
        <div className={styles.PROCESS_CONTENT_WRAPPER_CLASSES} onClick={() => setIsEditing(true)}>
           {steps.map((step, i) => {
             const isException = step.toLowerCase().includes('exception') || step.toLowerCase().includes('fail');
             return (
               <React.Fragment key={i}>
                 <div className={cn(
                   styles.PROCESS_STEP_BASE_CLASSES,
                   isException ? styles.PROCESS_STEP_EXCEPTION_CLASSES : styles.PROCESS_STEP_NORMAL_CLASSES
                 )}>
                   {step}
                 </div>
                 {i < steps.length - 1 && <ArrowRight className={styles.PROCESS_ARROW_CLASSES} />}
               </React.Fragment>
             );
           })}
        </div>
        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDelete(); }} className={styles.PROCESS_DELETE_BUTTON_CLASSES}>
          <Trash2 className={styles.TRASH_ICON_CLASSES} />
        </Button>
      </div>
    );
  }

  // 2. ACTOR
  if (variant === 'actor') {
      return (
        <div className={styles.ACTOR_WRAPPER_CLASSES} onClick={() => setIsEditing(true)}>
            <div className={styles.ACTOR_AVATAR_CLASSES}>
                <User className="h-4 w-4" />
            </div>
            {/* Apply renderContent here too */}
            <div className={styles.ACTOR_TEXT_CLASSES}>
                {renderContent(value)}
            </div>
            
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                 <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDelete(); }} className={styles.DELETE_BUTTON_CLASSES}>
                    <Trash2 className={styles.TRASH_ICON_CLASSES} />
                 </Button>
            </div>
        </div>
      );
  }

  // 3. METRIC
  if (variant === 'metric') {
      return (
        <div className={styles.METRIC_WRAPPER_CLASSES} onClick={() => setIsEditing(true)}>
            <div className="flex items-center gap-3 w-full">
                <TrendingUp className="h-4 w-4 text-emerald-500 shrink-0" />
                <div className={styles.METRIC_TEXT_CLASSES}>
                    {renderContent(value)}
                </div>
            </div>
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDelete(); }} className={styles.DELETE_BUTTON_CLASSES}>
                <Trash2 className={styles.TRASH_ICON_CLASSES} />
            </Button>
        </div>
      );
  }

  // 4. GOAL
  if (variant === 'goal') {
      return (
        <div className={styles.GOAL_WRAPPER_CLASSES} onClick={() => setIsEditing(true)}>
            <CheckCircle2 className={styles.GOAL_ICON_CLASSES} />
            <div className={styles.GOAL_TEXT_CLASSES}>
                {renderContent(value)}
            </div>
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDelete(); }} className={styles.DELETE_BUTTON_CLASSES}>
                <Trash2 className={styles.TRASH_ICON_CLASSES} />
            </Button>
        </div>
      );
  }

  // 5. DEFAULT (Applies to System Constraints, Data Schema text items, etc.)
  return (
    <div className={styles.STANDARD_WRAPPER_CLASSES}>
      <GripVertical className={styles.DRAG_HANDLE_CLASSES} />
      <div className={styles.TEXT_CONTENT_CLASSES} onClick={() => setIsEditing(true)}>
        {renderContent(value)}
      </div>
      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDelete(); }} className={styles.DELETE_BUTTON_CLASSES}>
        <Trash2 className={styles.TRASH_ICON_CLASSES} />
      </Button>
    </div>
  );
};