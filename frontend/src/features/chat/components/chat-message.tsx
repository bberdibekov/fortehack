import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/shared/utils';
import { Bot, User, Copy, RefreshCw } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar';

interface MessageProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  isStreaming?: boolean;
}

export const ChatMessage = React.memo(({ role, content, isStreaming }: MessageProps) => {
  const isUser = role === 'user';

  return (
    <div className={cn(
      "group w-full text-slate-800 dark:text-slate-100 border-b border-transparent hover:bg-muted/20 transition-colors py-8 px-4 md:px-8",
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
        <div className="relative flex-1 overflow-hidden">
          <div className="prose prose-slate dark:prose-invert max-w-none leading-7 text-[15px] break-words">
            {isUser ? (
              <div className="whitespace-pre-wrap font-medium text-slate-800 dark:text-slate-100">
                {content}
              </div>
            ) : (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content + (isStreaming ? ' ▍' : '')}
              </ReactMarkdown>
            )}
          </div>

          {/* Message Actions (Only visible on hover, not for user) */}
          {!isUser && !isStreaming && (
            <div className="flex items-center gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
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