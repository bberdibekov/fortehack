import { Sparkles, ArrowRight } from 'lucide-react';
import { useChatStore } from '@/features/chat/stores/chat-store';
import { Button } from '@/shared/components/ui/button';

interface SuggestionChipsProps {
  onSelect: (text: string) => void;
}

export const SuggestionChips = ({ onSelect }: SuggestionChipsProps) => {
  const { suggestions, isStreaming } = useChatStore();

  if (suggestions.length === 0 || isStreaming) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-2 px-1 mask-linear-fade">
      <div className="flex items-center gap-2 animate-in slide-in-from-bottom-2 fade-in duration-300">
        <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary shrink-0">
            <Sparkles className="h-3.5 w-3.5" />
        </div>
        {suggestions.map((text, i) => (
          <Button
            key={i}
            variant="outline"
            size="sm"
            onClick={() => onSelect(text)}
            className="h-7 text-xs font-normal rounded-full bg-background/50 hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all whitespace-nowrap shadow-sm"
          >
            {text}
            <ArrowRight className="ml-1.5 h-3 w-3 opacity-50" />
          </Button>
        ))}
      </div>
    </div>
  );
};