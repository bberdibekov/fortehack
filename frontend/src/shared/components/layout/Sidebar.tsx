import React from 'react';
import { 
  MessageSquarePlus, 
  History, 
  Settings, 
  FileUp, 
  Mic, 
  Search, 
  HelpCircle, 
  User, 
  PanelLeftClose,
  PanelLeftOpen,
  Moon,
  Sun
} from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/shared/components/ui/tooltip';

import { ChatHistory } from '@/features/chat/components/chat-history';
import { SettingsDialog } from '@/features/settings/components/settings-dialog';
import { HelpDialog } from '@/shared/components/help-dialog';

import { useUIStore } from '@/core/store/ui-store';
import { useTheme } from '@/shared/components/theme-provider';
import { cn } from '@/shared/utils';
import { clearSession } from '@/shared/utils/session-manager';

interface SidebarProps {
  className?: string;
}

const SidebarItem = ({ 
  icon: Icon, 
  label, 
  onClick, 
  active = false 
}: { 
  icon: any; 
  label: string; 
  onClick?: () => void; 
  active?: boolean; 
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        variant={active ? "secondary" : "ghost"}
        size="icon"
        className={cn(
          "h-10 w-10 rounded-xl md:h-12 md:w-12 transition-all duration-200", 
          active && "bg-muted shadow-sm",
          "hover:bg-muted/80"
        )}
        onClick={onClick}
      >
        <Icon className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground group-hover:text-foreground" />
        <span className="sr-only">{label}</span>
      </Button>
    </TooltipTrigger>
    <TooltipContent side="right" className="flex items-center gap-4 font-medium z-50">
      {label}
    </TooltipContent>
  </Tooltip>
);

export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const { sidebarOpen, toggleSidebar, setSearchOpen } = useUIStore();
  const { theme, setTheme } = useTheme();
  
  const handleNewChat = () => {
    if (confirm("Start a new chat? This will clear the current session.")) {
      // 1. Remove ID from storage and URL
      clearSession();
      
      // 2. Force Reload
      // This ensures the App re-initializes, useSocketEvents runs again (finding no session ID),
      // and connects to the backend as a new user session.
      window.location.reload();
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  if (!sidebarOpen) {
    return (
      <div className="absolute left-4 top-4 z-50 animate-in fade-in duration-300">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={toggleSidebar}
                className="bg-background shadow-md hover:bg-accent border-muted-foreground/20"
              >
                <PanelLeftOpen className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Expand Sidebar</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside className={cn(
        "flex flex-col border-r bg-muted/10 h-screen transition-all duration-300 ease-in-out z-40",
        "w-[70px] md:w-[80px]", 
        className
      )}>
        
        <div className="flex flex-col items-center gap-3 py-6">
          <div className="mb-2">
             <SidebarItem 
                icon={MessageSquarePlus} 
                label="New Chat" 
                active 
                onClick={handleNewChat}
             />
          </div>
          
          <SidebarItem 
            icon={Search} 
            label="Search (⌘K)" 
            onClick={() => setSearchOpen(true)}
          />
          
          <ChatHistory>
            <div>
              <SidebarItem icon={History} label="History" />
            </div>
          </ChatHistory>
        </div>

        <div className="mx-auto w-10 border-t border-border/60 my-2" />

        <div className="flex flex-col items-center gap-3 py-2 flex-1">
          <SidebarItem icon={FileUp} label="Upload File" />
          <SidebarItem icon={Mic} label="Voice Input" />
        </div>

        <div className="flex flex-col items-center gap-3 py-6 mt-auto bg-background/50 w-full border-t border-border/40 backdrop-blur-sm">
          
          <SidebarItem 
            icon={theme === 'dark' ? Sun : Moon} 
            label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`} 
            onClick={toggleTheme} 
          />

          <HelpDialog>
            <div>
              <SidebarItem icon={HelpCircle} label="Help & Documentation" />
            </div>
          </HelpDialog>

          <SettingsDialog>
            <div>
              <SidebarItem icon={Settings} label="Settings" />
            </div>
          </SettingsDialog>
          
          <div className="w-10 border-t border-border/60 my-1" />

          <SidebarItem 
             icon={PanelLeftClose} 
             label="Collapse Sidebar" 
             onClick={toggleSidebar} 
          />
          
          <div className="pt-2">
             <Button variant="ghost" size="icon" className="rounded-full overflow-hidden h-10 w-10 border border-border shadow-sm hover:ring-2 hover:ring-primary/20 transition-all">
                <User className="h-6 w-6" />
             </Button>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
};