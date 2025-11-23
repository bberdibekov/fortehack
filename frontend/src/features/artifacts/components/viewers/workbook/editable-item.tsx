import React, { useState, useRef, useEffect } from 'react';
import { Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { cn } from '@/shared/utils';

interface EditableItemProps {
  value: string;
  onSave: (val: string) => void;
  onDelete: () => void;
  isNew?: boolean;
}

export const EditableItem = ({ value, onSave, onDelete, isNew }: EditableItemProps) => {
  const [isEditing, setIsEditing] = useState(isNew);
  const [tempValue, setTempValue] = useState(value);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus if new
  useEffect(() => {
    if (isNew && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isNew]);

  const handleSave = () => {
    if (tempValue.trim() === '') {
      onDelete(); // Auto-delete empty items on blur
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

  if (isEditing) {
    return (
      <div className="flex items-start gap-2 py-2 animate-in fade-in zoom-in-95 duration-200">
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
          className="min-h-[38px] resize-none overflow-hidden py-1.5 text-sm"
          rows={1}
        />
      </div>
    );
  }

  return (
    <div className="group flex items-start gap-2 py-2 hover:bg-muted/40 rounded-md px-2 -mx-2 transition-colors cursor-pointer">
      {/* Drag Handle Placeholder (Visual only for now) */}
      <GripVertical className="h-4 w-4 text-muted-foreground/20 mt-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
      
      <div 
        className="flex-1 text-sm leading-relaxed break-words mt-0.5"
        onClick={() => setIsEditing(true)}
      >
        {value}
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="h-6 w-6 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
};