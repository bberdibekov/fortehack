import React, { useEffect, useRef, useState } from 'react';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Upload } from 'lucide-react';

import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';

import { useChatStore } from '@/features/chat/stores/chat-store';
import { useChatSocket } from '@/shared/hooks/use-chat-socket';
import { StatusIndicator } from './status-indicator';

export const ChatContainer = () => {
  // 1. Hooks & State
  const { messages, isStreaming, addAttachment } = useChatStore();
  const { sendMessage } = useChatSocket();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // 2. Auto-scroll to bottom when messages change
  useEffect(() => {
    // We target the viewport inside the Shadcn ScrollArea
    if (scrollRef.current) {
      const scrollViewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
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
    // FIX 1: Added min-h-0 to allow flex shrinking within the ResizablePanel
    <div 
      className="flex flex-col h-full w-full bg-background relative"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <StatusIndicator />

      {/* ... Drag Overlay ... */}

      {/* SCROLL AREA: The CSS Hack */}
      {/* 1. flex-1: Take available space */}
      {/* 2. min-h-0: Allow shrinking (Firefox/Chrome fix) */}
      <ScrollArea 
        ref={scrollRef} 
        className="flex-1 min-h-0 w-full p-0"
      >
        <div className="flex flex-col min-h-full pb-4">
           {/* ... Message Mapping ... */}
           {messages.length > 0 && messages.map((msg, index) => (
             <ChatMessage 
               key={msg.id || index} 
               role={msg.role} 
               content={msg.content}
               isStreaming={isStreaming && index === messages.length - 1 && msg.role === 'assistant'}
             />
           ))}
        </div>
      </ScrollArea>

      {/* INPUT AREA: Fixed height */}
      <div className="flex-none w-full bg-background/80 backdrop-blur-sm z-20 border-t border-border/40">
        <ChatInput onSend={sendMessage} disabled={isStreaming} />
      </div>
    </div>
  );
};