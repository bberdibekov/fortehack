import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/shared/utils';
import { Bot, User, Copy, RefreshCw, Terminal } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar';
import { type Components } from 'react-markdown';

interface MessageProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  isStreaming?: boolean;
}

export const ChatMessage = React.memo(({ role, content, isStreaming }: MessageProps) => {
  const isUser = role === 'user';

  // --- CUSTOM MARKDOWN RENDERERS ---
  // This ensures styles apply even if @tailwindcss/typography is missing
  const markdownComponents: Components = {
    // 1. Headings
    h1: ({ children }) => <h1 className="text-2xl font-bold mt-6 mb-4">{children}</h1>,
    h2: ({ children }) => <h2 className="text-xl font-bold mt-5 mb-3">{children}</h2>,
    h3: ({ children }) => <h3 className="text-lg font-semibold mt-4 mb-2">{children}</h3>,
    
    // 2. Lists
    ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>,
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
    
    // 4. Code Blocks & Inline Code
    code: ({ className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || '');
      const isInline = !match && !String(children).includes('\n');

      if (isInline) {
        return (
          <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground border border-border">
            {children}
          </code>
        );
      }

      return (
        <div className="relative my-4 rounded-lg overflow-hidden border bg-slate-950 dark:bg-slate-900 text-slate-50">
           <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
             <div className="flex items-center gap-2">
               <Terminal className="h-3 w-3 text-slate-400" />
               <span className="text-xs text-slate-400 font-mono">
                 {match?.[1] || 'code'}
               </span>
             </div>
           </div>
           <div className="p-4 overflow-x-auto">
             <code className="text-sm font-mono leading-relaxed whitespace-pre">
               {children}
             </code>
           </div>
        </div>
      );
    },

    // 5. Tables
    table: ({ children }) => (
      <div className="my-4 w-full overflow-y-auto rounded-lg border">
        <table className="w-full text-sm">{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead className="bg-muted/50 border-b">{children}</thead>,
    tr: ({ children }) => <tr className="border-b last:border-0 hover:bg-muted/20 transition-colors">{children}</tr>,
    th: ({ children }) => <th className="px-4 py-3 text-left font-medium text-muted-foreground">{children}</th>,
    td: ({ children }) => <td className="px-4 py-3 align-top">{children}</td>,
    
    // 6. Blockquotes
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-primary/30 pl-4 italic text-muted-foreground my-4">
        {children}
      </blockquote>
    ),
  };

  return (
    <div className={cn(
      "group w-full text-foreground border-b border-transparent hover:bg-muted/20 transition-colors py-8 px-4 md:px-8",
      isUser ? "bg-background" : "bg-muted/5"
    )}>
      <div className="max-w-3xl mx-auto flex gap-6">
        {/* Avatar Column */}
        <div className="flex-shrink-0 flex flex-col relative items-end">
          <Avatar className={cn("h-8 w-8", isUser ? "bg-blue-600" : "bg-emerald-600")}>
            <AvatarFallback className="bg-transparent text-white">
              {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Content Column */}
        <div className="relative flex-1 overflow-hidden min-w-0">
          <div className="text-[15px] leading-relaxed">
            {isUser ? (
              <div className="whitespace-pre-wrap font-medium">
                {content}
              </div>
            ) : (
              // Passed the custom 'components' map here
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {content + (isStreaming ? ' ▍' : '')}
              </ReactMarkdown>
            )}
          </div>

          {/* Message Actions */}
          {!isUser && !isStreaming && (
            <div className="flex items-center gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ChatMessage.displayName = 'ChatMessage';