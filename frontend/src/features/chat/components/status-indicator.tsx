import { useEffect, useState } from 'react';
import { Sparkles, CheckCircle2, BrainCircuit, Loader2 } from 'lucide-react';
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
      // Delay hiding to allow "Success" state to be seen for a moment
      const timer = setTimeout(() => setVisible(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [status]);

  if (!visible && status === 'idle') return null;

  // Configuration map for visual styles
  const config = {
    idle: { 
      icon: Sparkles, 
      containerClass: "bg-background text-muted-foreground border-border",
      iconClass: ""
    },
    thinking: { 
      icon: BrainCircuit, 
      // Blue: Deep thought
      containerClass: "bg-blue-100 text-blue-700 border-blue-200 shadow-lg shadow-blue-500/20 dark:bg-blue-900/60 dark:text-blue-100 dark:border-blue-700 animate-pulse",
      iconClass: "animate-spin-slow" 
    },
    working: { 
      icon: Loader2, 
      // Purple: Building/Generating Artifacts
      containerClass: "bg-purple-100 text-purple-700 border-purple-200 shadow-lg shadow-purple-500/20 dark:bg-purple-900/60 dark:text-purple-100 dark:border-purple-700 animate-pulse",
      iconClass: "animate-spin" 
    },
    success: { 
      icon: CheckCircle2, 
      // Green: Success (Static, no pulse)
      containerClass: "bg-emerald-100 text-emerald-700 border-emerald-200 shadow-md shadow-emerald-500/10 dark:bg-emerald-900/60 dark:text-emerald-100 dark:border-emerald-700",
      iconClass: "" 
    },
  };

  const currentConfig = config[status] || config.idle;
  const Icon = currentConfig.icon;

  return (
    <div className="absolute top-6 left-0 right-0 flex justify-center z-30 pointer-events-none">
      <div 
        className={cn(
          "flex items-center gap-3 px-5 py-2.5 rounded-full border backdrop-blur-md transition-all duration-500 ease-in-out transform",
          currentConfig.containerClass,
          visible ? "translate-y-0 opacity-100 scale-100" : "-translate-y-8 opacity-0 scale-95",
          "max-w-md truncate font-semibold text-sm shadow-sm"
        )}
      >
        <Icon className={cn("h-4 w-4 shrink-0", currentConfig.iconClass)} />
        <span className="animate-in fade-in duration-300 leading-none pb-0.5">
          {statusMessage || "Processing..."}
        </span>
      </div>
    </div>
  );
};