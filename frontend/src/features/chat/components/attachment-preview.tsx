import { X, FileText, Image as ImageIcon, FileCode } from 'lucide-react';
import { useChatStore } from '@/features/chat/stores/chat-store';
import { Button } from '@/shared/components/ui/button';

export const AttachmentPreview = () => {
  const { pendingAttachments, removeAttachment } = useChatStore();

  if (pendingAttachments.length === 0) return null;

  return (
    <div className="flex gap-2 px-4 pb-2 overflow-x-auto scrollbar-hide">
      {pendingAttachments.map((att) => (
        <div 
          key={att.id} 
          className="relative group flex items-center gap-2 bg-muted/50 border rounded-lg p-2 pr-8 min-w-[120px] max-w-[200px]"
        >
          {/* Icon / Thumbnail logic */}
          <div className="h-8 w-8 shrink-0 rounded bg-background flex items-center justify-center border overflow-hidden">
            {att.previewUrl ? (
              <img src={att.previewUrl} alt="preview" className="h-full w-full object-cover" />
            ) : (
              <FileIcon type={att.type} />
            )}
          </div>

          <div className="flex flex-col overflow-hidden">
            <span className="text-xs font-medium truncate">{att.name}</span>
            <span className="text-[10px] text-muted-foreground">
              {(att.size / 1024).toFixed(1)} KB
            </span>
          </div>

          {/* Remove Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-1 right-1 h-5 w-5 rounded-full hover:bg-destructive hover:text-white"
            onClick={() => removeAttachment(att.id)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}
    </div>
  );
};

const FileIcon = ({ type }: { type: string }) => {
  if (type.includes('image')) return <ImageIcon className="h-4 w-4 text-purple-500" />;
  if (type.includes('code') || type.includes('javascript') || type.includes('python')) 
    return <FileCode className="h-4 w-4 text-blue-500" />;
  return <FileText className="h-4 w-4 text-slate-500" />;
};