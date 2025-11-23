import { useEffect } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/shared/components/ui/command";
import { 
  Calendar, 
  Settings, 
  User, 
  MessageSquarePlus, 
  Moon, 
  Sun,
  Laptop
} from "lucide-react";
import { useUIStore } from "@/core/store/ui-store";
import { useTheme } from "@/shared/components/theme-provider";
import { useChatStore } from "@/features/chat/stores/chat-store";
import { useArtifactStore } from "@/features/artifacts/stores/artifact-store";

export function CommandMenu() {
  const { isSearchOpen, setSearchOpen } = useUIStore();
  const { setTheme } = useTheme();
  const resetChat = useChatStore((s) => s.reset);
  const resetArtifacts = useArtifactStore((s) => s.reset);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen(!isSearchOpen);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [setSearchOpen]);

  const runCommand = (command: () => void) => {
    setSearchOpen(false);
    command();
  };

  return (
    <CommandDialog open={isSearchOpen} onOpenChange={setSearchOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="Suggestions">
          <CommandItem onSelect={() => runCommand(() => {
              resetChat();
              resetArtifacts();
          })}>
            <MessageSquarePlus className="mr-2 h-4 w-4" />
            <span>New Chat</span>
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => console.log("Calendar"))}>
            <Calendar className="mr-2 h-4 w-4" />
            <span>Search History</span>
          </CommandItem>
        </CommandGroup>
        
        <CommandSeparator />
        
        <CommandGroup heading="Theme">
          <CommandItem onSelect={() => runCommand(() => setTheme("light"))}>
            <Sun className="mr-2 h-4 w-4" />
            <span>Light Mode</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setTheme("dark"))}>
            <Moon className="mr-2 h-4 w-4" />
            <span>Dark Mode</span>
          </CommandItem>
           <CommandItem onSelect={() => runCommand(() => setTheme("system"))}>
            <Laptop className="mr-2 h-4 w-4" />
            <span>System</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Settings">
          <CommandItem onSelect={() => runCommand(() => console.log("Profile"))}>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
            <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => console.log("Settings"))}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}