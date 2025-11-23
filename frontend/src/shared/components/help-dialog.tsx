import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Badge } from "@/shared/components/ui/badge";
import { ScrollArea } from "@/shared/components/ui/scroll-area";

export const HelpDialog = ({ children }: { children: React.ReactNode }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>Documentation & Shortcuts</DialogTitle>
          <DialogDescription>
            Learn how to use the Analyst Interface efficiently.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-full pr-4">
          <div className="space-y-6 pb-6">
            
            {/* Shortcuts Section */}
            <section>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                Keyboard Shortcuts
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <ShortcutItem keys={["⌘", "K"]} description="Open Command Palette" />
                <ShortcutItem keys={["Enter"]} description="Send Message" />
                <ShortcutItem keys={["Shift", "Enter"]} description="New Line" />
                <ShortcutItem keys={["⌘", "B"]} description="Toggle Sidebar" />
                <ShortcutItem keys={["⌘", "/"]} description="Open this Help" />
              </div>
            </section>

            {/* Features Section */}
            <section className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Artifacts System</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                When the AI generates code, data visualizations, or HTML prototypes, 
                they open in the <strong>Right Panel</strong> (Artifacts).
              </p>
              <ul className="list-disc pl-5 text-sm space-y-2 text-muted-foreground">
                <li><strong>Code:</strong> Features full syntax highlighting and copy support.</li>
                <li><strong>Previews:</strong> HTML and Dashboards run in a secure sandbox.</li>
                <li><strong>Focus Mode:</strong> Click the maximize icon to view artifacts full-screen.</li>
              </ul>
            </section>

             <section className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Chat Features</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The chat interface supports Markdown, real-time streaming, and file attachments.
                Drag and drop files directly onto the chat window to analyze them.
              </p>
            </section>

          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

const ShortcutItem = ({ keys, description }: { keys: string[], description: string }) => (
  <div className="flex items-center justify-between p-2 border rounded-lg bg-muted/10">
    <span className="text-sm font-medium">{description}</span>
    <div className="flex gap-1">
      {keys.map((k, i) => (
        <Badge key={i} variant="outline" className="bg-background text-muted-foreground font-mono">
          {k}
        </Badge>
      ))}
    </div>
  </div>
);