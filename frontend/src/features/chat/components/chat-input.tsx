import React, { useRef, useState } from 'react';
import { SendHorizontal, Paperclip, Mic } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { useChatStore } from '@/features/chat/stores/chat-store';
import { AttachmentPreview } from './attachment-preview';

interface ChatInputProps {
  onSend: (message: string, attachments: File[]) => void; // Update signature
  disabled?: boolean;
}

export const ChatInput = ({ onSend, disabled }: ChatInputProps) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Store hooks
  const { addAttachment, pendingAttachments, clearAttachments } = useChatStore();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if ((!input.trim() && pendingAttachments.length === 0) || disabled) return;
    
    // Extract actual File objects to send
    const filesToSend = pendingAttachments.map(a => a.file);
    
    onSend(input, filesToSend);
    
    // Reset State
    setInput('');
    clearAttachments();
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  // Handle File Selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach(file => addAttachment(file));
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-3xl mx-auto w-full px-4 pb-4 pt-2">
      
      {/* 1. Preview Area (New) */}
      <AttachmentPreview />

      <div className="relative flex items-end gap-2 bg-muted/30 rounded-2xl p-2 ring-offset-background focus-within:ring-2 focus-within:ring-ring/10 transition-all mt-2">
        
        {/* Hidden File Input */}
        <input 
          type="file" 
          multiple 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileSelect}
        />

        {/* Paperclip Trigger */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-9 w-9 text-muted-foreground mb-0.5 shrink-0 rounded-xl hover:bg-background"
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        <Textarea
          ref={textareaRef}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Message AI..."
          className="min-h-[24px] max-h-[200px] w-full resize-none border-0 bg-transparent p-2 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground scrollbar-hide"
          rows={1}
          disabled={disabled}
        />

        {input.trim() || pendingAttachments.length > 0 ? (
           <Button 
            size="icon" 
            onClick={handleSend}
            disabled={disabled}
            className="h-9 w-9 mb-0.5 shrink-0 bg-blue-600 hover:bg-blue-700 transition-all rounded-xl"
          >
            <SendHorizontal className="h-5 w-5 text-white" />
          </Button>
        ) : (
          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground mb-0.5 shrink-0 rounded-xl hover:bg-background">
             <Mic className="h-5 w-5" />
          </Button>
        )}
       
      </div>
      <div className="text-center mt-2">
        <span className="text-xs text-muted-foreground/60">
          AI can make mistakes. Check important info.
        </span>
      </div>
    </div>
  );
};