import { useEffect, useState } from 'react';
import { Sparkles, CheckCircle2, BrainCircuit } from 'lucide-react';
import { useChatStore } from '@/features/chat/stores/chat-store';
import { cn } from '@/shared/utils';

export const StatusIndicator = () => {
  const { status, statusMessage } = useChatStore();
  const [visible, setVisible] = useState(false);

  // Handle visibility transitions
  useEffect(() => {
    if (status !== 'idle') {
      setVisible(true);
    } else {
      // Delay hiding to allow "Success" state to be seen
      const timer = setTimeout(() => setVisible(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  if (!visible && status === 'idle') return null;

  // Configuration map for visual styles
  const config = {
    idle: { icon: Sparkles, color: "bg-background text-muted-foreground border-border" },
    thinking: { icon: BrainCircuit, color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800" },
    working: { icon: Sparkles, color: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800" },
    success: { icon: CheckCircle2, color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800" },
  };

  const currentConfig = config[status] || config.idle;
  const Icon = currentConfig.icon;

  return (
    <div className="absolute top-4 left-0 right-0 flex justify-center z-20 pointer-events-none">
      <div 
        className={cn(
          "flex items-center gap-2.5 px-4 py-2 rounded-full border shadow-sm backdrop-blur-md transition-all duration-300 transform",
          currentConfig.color,
          visible ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0",
          "max-w-md truncate font-medium text-xs md:text-sm"
        )}
      >
        <Icon className={cn("h-4 w-4", status !== 'success' && status !== 'idle' && "animate-spin-slow")} />
        <span className="animate-in fade-in duration-300">{statusMessage || "Processing..."}</span>
      </div>
    </div>
  );
};