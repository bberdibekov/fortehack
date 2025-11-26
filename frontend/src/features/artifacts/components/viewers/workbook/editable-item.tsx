// src/features/artifacts/components/viewers/workbook/editable-item.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Trash2, GripVertical, ArrowDown, AlertCircle } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { cn } from '@/shared/utils';
import * as styles from '../styles/editable-item.styles';

export interface EditableItemProps {
  value: string;
  onSave: (val: string) => void;
  onDelete: () => void;
  isNew?: boolean;
  isProcess?: boolean;
}

export const EditableItem = ({ value, onSave, onDelete, isNew, isProcess }: EditableItemProps) => {
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

  // 1. EDIT MODE
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
          placeholder={isProcess ? "Step 1 -> Step 2 -> Step 3" : "Enter text..."}
          className={cn(styles.EDIT_TEXTAREA_CLASSES)}
          rows={1}
        />
      </div>
    );
  }

  // 2. VIEW MODE: PROCESS FLOW
  if (isProcess && value.includes('->')) {
    const steps = value.split('->').map(s => s.trim());
    return (
      <div className={styles.PROCESS_VIEW_WRAPPER_CLASSES}>
        <div className={styles.PROCESS_DRAG_HANDLE_CLASSES}>
           <GripVertical className={styles.PROCESS_HANDLE_ICON_CLASSES} />
        </div>
        <div className={styles.PROCESS_CONTENT_WRAPPER_CLASSES} onClick={() => setIsEditing(true)}>
           {steps.map((step, i) => {
             // Conditional styling logic for exceptions
             const isException = step.toLowerCase().includes('exception') || step.toLowerCase().includes('fail');
             
             const stepClasses = cn(
               styles.PROCESS_STEP_BASE_CLASSES,
               isException 
                ? styles.PROCESS_STEP_EXCEPTION_CLASSES
                : styles.PROCESS_STEP_NORMAL_CLASSES
             );

             return (
               <React.Fragment key={i}>
                 <div className={stepClasses}>
                   {step}
                 </div>
                 {i < steps.length - 1 && <ArrowDown className={styles.PROCESS_ARROW_CLASSES} />}
               </React.Fragment>
             );
           })}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className={styles.PROCESS_DELETE_BUTTON_CLASSES}
        >
          <Trash2 className={styles.TRASH_ICON_CLASSES} />
        </Button>
      </div>
    );
  }

  // 3. VIEW MODE: STANDARD
  const isWarning = (value.toLowerCase().startsWith('exception') || value.toLowerCase().startsWith('edge case'));
  
  return (
    <div className={styles.STANDARD_VIEW_WRAPPER_CLASSES}>
      <GripVertical className={styles.DRAG_HANDLE_CLASSES} />
      <div 
        className={styles.TEXT_CONTENT_CLASSES}
        onClick={() => setIsEditing(true)}
      >
        {isWarning && (
           <AlertCircle className={styles.WARNING_ICON_CLASSES} />
        )}
        {value}
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className={styles.DELETE_BUTTON_CLASSES}
      >
        <Trash2 className={styles.TRASH_ICON_CLASSES} />
      </Button>
    </div>
  );
};