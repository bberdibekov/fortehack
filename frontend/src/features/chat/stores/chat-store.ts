import { create } from 'zustand';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  status?: 'streaming' | 'complete' | 'error';
  attachments?: FileAttachment[]; // <--- New field
}

// New Interface
export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  previewUrl?: string; // For images
  file: File; // The actual file object
}

interface ChatState {
  messages: Message[];
  isStreaming: boolean;
  pendingAttachments: FileAttachment[];
  reset: () => void;
  
  // Actions
  addMessage: (message: Message) => void;
  updateLastMessage: (contentDelta: string) => void;
  setStatus: (isStreaming: boolean) => void;
  
  // New Actions
  addAttachment: (file: File) => void;
  removeAttachment: (id: string) => void;
  clearAttachments: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isStreaming: false,
  pendingAttachments: [], // Start empty
  
  addMessage: (msg) => set((state) => ({ 
    messages: [...state.messages, msg] 
  })),
  
  updateLastMessage: (delta) => set((state) => {
    const lastMsg = state.messages[state.messages.length - 1];
    if (!lastMsg || lastMsg.role !== 'assistant') return state;
    const updatedMsg = { ...lastMsg, content: lastMsg.content + delta };
    return { messages: [...state.messages.slice(0, -1), updatedMsg] };
  }),
  
  setStatus: (status) => set({ isStreaming: status }),

  // --- Attachment Logic ---
  addAttachment: (file) => {
    const isImage = file.type.startsWith('image/');
    const attachment: FileAttachment = {
      id: Math.random().toString(36).substring(7),
      name: file.name,
      type: file.type,
      size: file.size,
      file,
      previewUrl: isImage ? URL.createObjectURL(file) : undefined
    };

    set((state) => ({
      pendingAttachments: [...state.pendingAttachments, attachment]
    }));
  },

  removeAttachment: (id) => set((state) => ({
    pendingAttachments: state.pendingAttachments.filter(a => a.id !== id)
  })),

  clearAttachments: () => set({ pendingAttachments: [] }),
  reset: () => set({ 
    messages: [], 
    isStreaming: false, 
    pendingAttachments: [] 
  }),
}));