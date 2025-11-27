import React from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/shared/components/ui/sheet';
import { Button } from '@/shared/components/ui/button';
import { MessageSquare, Trash2, Search } from 'lucide-react';
import { Input } from '@/shared/components/ui/input';
import { ScrollArea } from '@/shared/components/ui/scroll-area';

// Mock Data
const MOCK_HISTORY = [
  { id: '1', title: 'Python Data Analysis', date: 'Today' },
  { id: '2', title: 'React Component Help', date: 'Today' },
  { id: '3', title: 'Q3 Financial Report', date: 'Yesterday' },
  { id: '4', title: 'Debugging Docker', date: 'Previous 7 Days' },
];

interface ChatHistoryProps {
  children: React.ReactNode;
}

export const ChatHistory = ({ children }: ChatHistoryProps) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px] p-0 gap-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="text-base">Chat History</SheetTitle>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search chats..." className="pl-8 bg-muted/50" />
          </div>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-120px)]">
          <div className="flex flex-col p-2 gap-1">
            {MOCK_HISTORY.map((chat) => (
              <Button 
                key={chat.id} 
                variant="ghost" 
                className="justify-start h-auto py-3 px-3 text-left font-normal"
              >
                <MessageSquare className="h-4 w-4 mr-3 text-muted-foreground" />
                <div className="flex flex-col gap-0.5 overflow-hidden">
                   <span className="truncate text-sm">{chat.title}</span>
                   <span className="text-[10px] text-muted-foreground">{chat.date}</span>
                </div>
              </Button>
            ))}
          </div>
        </ScrollArea>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-background">
            <Button variant="outline" className="w-full text-destructive hover:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Clear History
            </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};