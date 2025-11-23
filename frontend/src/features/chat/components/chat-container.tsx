import React, { useEffect, useRef, useState } from 'react';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Upload } from 'lucide-react';

import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';

import { useChatStore } from '@/features/chat/stores/chat-store';
import { useChatSocket } from '@/shared/hooks/use-chat-socket';

export const ChatContainer = () => {
  // 1. Hooks & State
  const { messages, isStreaming, addAttachment } = useChatStore();
  const { sendMessage } = useChatSocket();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // 2. Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isStreaming]);

  // 3. Drag & Drop Handlers
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only disable if we are leaving the main container
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach(file => addAttachment(file));
    }
  };

  // 4. Render
  return (
    <div 
      className="flex flex-col h-full w-full bg-background relative"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* A. Drag Overlay (Visible only when dragging files) */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center m-4 rounded-xl border-2 border-dashed border-primary transition-all duration-200 pointer-events-none">
           <div className="flex flex-col items-center gap-4 text-primary animate-in fade-in zoom-in duration-300">
              <div className="p-4 bg-primary/10 rounded-full">
                <Upload className="h-10 w-10" />
              </div>
              <span className="text-xl font-medium">Drop files to upload</span>
           </div>
        </div>
      )}

      {/* B. Scrollable Message Area */}
      <ScrollArea ref={scrollRef} className="flex-1 w-full">
        <div className="flex flex-col min-h-full pb-4">
          {messages.length === 0 ? (
            // Empty State Greeting
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground mt-[10vh]">
              <div className="w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <div className="w-8 h-8 rounded-full bg-primary/20" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">How can I help you today?</h2>
              <p className="max-w-md text-sm text-muted-foreground/80">
                I can help you analyze data, write code, or draft documents. 
                Drag and drop files here to get started.
              </p>
            </div>
          ) : (
            // Message List
            messages.map((msg, index) => (
              <ChatMessage 
                key={msg.id || index} 
                role={msg.role} 
                content={msg.content}
                // Only animate the cursor if it's the last AI message and streaming is active
                isStreaming={isStreaming && index === messages.length - 1 && msg.role === 'assistant'}
              />
            ))
          )}
        </div>
      </ScrollArea>

      <div className="flex-none w-full bg-background/80 backdrop-blur-sm z-10">
        <ChatInput onSend={sendMessage} disabled={isStreaming} />
      </div>
    </div>
  );
};