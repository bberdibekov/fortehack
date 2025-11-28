import React from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/shared/utils';
import { Bot, User, Copy, RefreshCw, Terminal } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar';

interface MessageProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  isStreaming?: boolean;
}

export const ChatMessage = React.memo(({ role, content, isStreaming }: MessageProps) => {
  const isUser = role === 'user';

  // --- CUSTOM MARKDOWN RENDERERS ---
  const markdownComponents: Components = {
    // 1. Headings
    h1: ({ children }) => <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>,
    h2: ({ children }) => <h2 className="text-lg font-bold mt-3 mb-2">{children}</h2>,
    h3: ({ children }) => <h3 className="text-base font-semibold mt-2 mb-1">{children}</h3>,
    
    // 2. Lists
    ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
    li: ({ children }) => <li className="pl-1">{children}</li>,
    
    // 3. Links
    a: ({ href, children }) => (
      <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-blue-500 hover:underline underline-offset-4"
      >
        {children}
      </a>
    ),
    
    // 4. Code Blocks
    code: ({ className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || '');
      const isInline = !match && !String(children).includes('\n');

      if (isInline) {
        return (
          <code className={cn(
            "px-1.5 py-0.5 rounded text-sm font-mono border",
            isUser 
              ? "bg-primary-foreground/20 text-primary-foreground border-primary-foreground/20" 
              : "bg-muted text-foreground border-border"
          )}>
            {children}
          </code>
        );
      }

      return (
        <div className="relative my-3 rounded-lg overflow-hidden border bg-slate-950 dark:bg-slate-900 text-slate-50 w-full">
           <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800">
             <div className="flex items-center gap-2">
               <Terminal className="h-3 w-3 text-slate-400" />
               <span className="text-xs text-slate-400 font-mono">
                 {match?.[1] || 'code'}
               </span>
             </div>
           </div>
           <div className="p-3 overflow-x-auto">
             <code className="text-xs md:text-sm font-mono leading-relaxed whitespace-pre">
               {children}
             </code>
           </div>
        </div>
      );
    },

    // 5. Tables
    table: ({ children }) => (
      <div className="my-3 w-full overflow-y-auto rounded-lg border bg-background/50">
        <table className="w-full text-sm">{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead className="bg-muted/50 border-b">{children}</thead>,
    tr: ({ children }) => <tr className="border-b last:border-0 hover:bg-muted/20 transition-colors">{children}</tr>,
    th: ({ children }) => <th className="px-3 py-2 text-left font-medium text-muted-foreground">{children}</th>,
    td: ({ children }) => <td className="px-3 py-2 align-top">{children}</td>,
    
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-primary/30 pl-3 italic text-muted-foreground my-2">
        {children}
      </blockquote>
    ),
  };

  return (
    <div className={cn(
      "w-full flex py-4 px-4 md:px-6",
      isUser ? "justify-end" : "justify-start"
    )}>
      
      <div className={cn(
        "flex max-w-[90%] md:max-w-[80%] lg:max-w-[70%] gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}>
        
        {/* Avatar */}
        <Avatar className={cn(
          "h-8 w-8 mt-1 shrink-0", 
          isUser ? "bg-primary" : "bg-emerald-600"
        )}>
          <AvatarFallback className="bg-transparent text-white">
            {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
          </AvatarFallback>
        </Avatar>

        {/* Message Bubble */}
        <div className={cn(
          "relative group rounded-2xl p-4 text-[15px] leading-relaxed shadow-sm overflow-hidden",
          isUser 
            ? "bg-primary text-primary-foreground rounded-tr-sm" 
            : "bg-muted/50 border border-border/50 rounded-tl-sm"
        )}>
          
          <div className={cn(
             "prose dark:prose-invert max-w-none break-words",
             // Override prose colors for user bubble to ensure contrast
             isUser && "prose-p:text-primary-foreground prose-headings:text-primary-foreground prose-strong:text-primary-foreground prose-li:text-primary-foreground"
          )}>
            {isUser ? (
              <div className="whitespace-pre-wrap font-medium">
                {content}
              </div>
            ) : (
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {content + (isStreaming ? ' ▍' : '')}
              </ReactMarkdown>
            )}
          </div>

          {/* Actions (Only for Assistant) */}
          {!isUser && !isStreaming && (
            <div className="flex items-center gap-1 mt-2 -ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" title="Copy">
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" title="Regenerate">
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ChatMessage.displayName = 'ChatMessage';