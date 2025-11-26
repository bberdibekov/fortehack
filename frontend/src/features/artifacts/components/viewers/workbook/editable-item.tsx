import React, { useState, useRef, useEffect } from 'react';
import { Trash2, GripVertical, ArrowDown, AlertCircle } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { cn } from '@/shared/utils';

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
      <div className="flex items-start gap-2 py-2 animate-in fade-in zoom-in-95 duration-200 w-full">
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
          className="min-h-[38px] resize-none overflow-hidden py-1.5 text-sm font-mono bg-background"
          rows={1}
        />
      </div>
    );
  }

  // 2. VIEW MODE: PROCESS FLOW
  if (isProcess && value.includes('->')) {
    const steps = value.split('->').map(s => s.trim());
    return (
      <div className="group relative py-4 pl-2 pr-8 hover:bg-muted/20 rounded-lg transition-colors border border-transparent hover:border-muted/50 my-2">
        <div className="absolute left-0 top-4 opacity-0 group-hover:opacity-100 cursor-grab">
           <GripVertical className="h-4 w-4 text-muted-foreground/40" />
        </div>
        <div className="flex flex-col items-center gap-1 ml-4 cursor-pointer" onClick={() => setIsEditing(true)}>
           {steps.map((step, i) => (
             <React.Fragment key={i}>
               <div className={cn(
                 "px-4 py-2 rounded-lg text-sm font-medium border w-full text-center shadow-sm transition-all",
                 step.toLowerCase().includes('exception') || step.toLowerCase().includes('fail')
                    ? "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/30 dark:text-red-300 dark:border-red-900" 
                    : "bg-background text-foreground border-border hover:border-primary/50"
               )}>
                 {step}
               </div>
               {i < steps.length - 1 && <ArrowDown className="h-4 w-4 text-muted-foreground/40 my-0.5" />}
             </React.Fragment>
           ))}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="absolute top-2 right-2 h-6 w-6 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  // 3. VIEW MODE: STANDARD
  return (
    <div className="group flex items-start gap-2 py-2 hover:bg-muted/40 rounded-md px-2 -mx-2 transition-colors cursor-pointer">
      <GripVertical className="h-4 w-4 text-muted-foreground/20 mt-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
      <div 
        className="flex-1 text-sm leading-relaxed break-words mt-0.5 flex gap-2"
        onClick={() => setIsEditing(true)}
      >
        {(value.toLowerCase().startsWith('exception') || value.toLowerCase().startsWith('edge case')) && (
           <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
        )}
        {value}
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="h-6 w-6 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
};