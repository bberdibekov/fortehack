import React, { useState, useEffect, useRef } from 'react';
import { Textarea } from '@/shared/components/ui/textarea';
import { cn } from '@/shared/utils';
import { Pencil } from 'lucide-react';

interface EditableTextProps {
  value: string;
  onSave: (val: string) => void;
  className?: string;
  multiline?: boolean;
  label?: string;
}

export const EditableText = ({ value, onSave, className, multiline = false, label }: EditableTextProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // Reset height
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [isEditing]);

  const handleSave = () => {
    if (tempValue.trim() !== value) {
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
        className={cn("min-h-[30px] resize-none overflow-hidden bg-background text-sm", className)}
        rows={1}
      />
    );
  }

  return (
    <div 
      onClick={() => setIsEditing(true)}
      className={cn(
        "group relative rounded-md border border-transparent hover:bg-muted/30 hover:border-muted-foreground/20 px-2 -mx-2 py-1 cursor-text transition-all", 
        className
      )}
    >
      {value || <span className="text-muted-foreground italic">Click to add {label}...</span>}
      <Pencil className="absolute right-2 top-2 h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
};