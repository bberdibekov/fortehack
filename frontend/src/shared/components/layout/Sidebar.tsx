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

// UI Components
import { Button } from '@/shared/components/ui/button';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/shared/components/ui/tooltip';

// Feature Components (Dialogs/Sheets)
import { ChatHistory } from '@/features/chat/components/chat-history';
import { SettingsDialog } from '@/features/settings/components/settings-dialog';
import { HelpDialog } from '@/shared/components/help-dialog';

// State & Hooks
import { useUIStore } from '@/core/store/ui-store';
import { useTheme } from '@/shared/components/theme-provider';
import { useChatStore } from '@/features/chat/stores/chat-store';
import { useArtifactStore } from '@/features/artifacts/stores/artifact-store';
import { cn } from '@/shared/utils';

interface SidebarProps {
  className?: string;
}

// --- Helper Component for Sidebar Items ---
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

// --- Main Sidebar Component ---
export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  // 1. Access Global State
  const { sidebarOpen, toggleSidebar, setSearchOpen } = useUIStore();
  const { theme, setTheme } = useTheme();
  
  // 2. Actions for Resetting Chat
  const resetChat = useChatStore(s => s.reset);
  const resetArtifacts = useArtifactStore(s => s.reset);

  // 3. Handlers
  const handleNewChat = () => {
    // In a real app, you might save before resetting
    if (confirm("Start a new chat? This will clear the current session.")) {
      resetChat();
      resetArtifacts();
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // 4. Render Collapsed State
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

  // 5. Render Expanded State
  return (
    <TooltipProvider delayDuration={0}>
      <aside className={cn(
        "flex flex-col border-r bg-muted/10 h-screen transition-all duration-300 ease-in-out z-40",
        "w-[70px] md:w-[80px]", 
        className
      )}>
        
        {/* --- TOP SECTION: Navigation --- */}
        <div className="flex flex-col items-center gap-3 py-6">
          {/* New Chat */}
          <div className="mb-2">
             <SidebarItem 
                icon={MessageSquarePlus} 
                label="New Chat" 
                active 
                onClick={handleNewChat}
             />
          </div>
          
          {/* Global Search */}
          <SidebarItem 
            icon={Search} 
            label="Search (⌘K)" 
            onClick={() => setSearchOpen(true)}
          />
          
          {/* History Drawer */}
          <ChatHistory>
            <div> {/* Wrapper needed for SheetTrigger to function correctly */}
              <SidebarItem icon={History} label="History" />
            </div>
          </ChatHistory>
        </div>

        {/* Divider */}
        <div className="mx-auto w-10 border-t border-border/60 my-2" />

        {/* --- MIDDLE SECTION: Tools --- */}
        <div className="flex flex-col items-center gap-3 py-2 flex-1">
          <SidebarItem icon={FileUp} label="Upload File" />
          <SidebarItem icon={Mic} label="Voice Input" />
        </div>

        {/* --- BOTTOM SECTION: System --- */}
        <div className="flex flex-col items-center gap-3 py-6 mt-auto bg-background/50 w-full border-t border-border/40 backdrop-blur-sm">
          
          {/* Theme Toggle */}
          <SidebarItem 
            icon={theme === 'dark' ? Sun : Moon} 
            label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`} 
            onClick={toggleTheme} 
          />

          {/* Help Dialog */}
          <HelpDialog>
            <div>
              <SidebarItem icon={HelpCircle} label="Help & Documentation" />
            </div>
          </HelpDialog>

          {/* Settings Dialog */}
          <SettingsDialog>
            <div>
              <SidebarItem icon={Settings} label="Settings" />
            </div>
          </SettingsDialog>
          
          <div className="w-10 border-t border-border/60 my-1" />

          {/* Collapse Sidebar */}
          <SidebarItem 
             icon={PanelLeftClose} 
             label="Collapse Sidebar" 
             onClick={toggleSidebar} 
          />
          
          {/* User Profile (Placeholder) */}
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