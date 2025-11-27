import { create } from "zustand";
import { type SystemStatus } from "@/core/api/types/generated";

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  status?: "streaming" | "complete" | "error";
  attachments?: FileAttachment[];
}

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  previewUrl?: string;
  file: File;
}

interface ChatState {
  messages: Message[];
  isStreaming: boolean;
  status: SystemStatus;
  statusMessage: string;
  pendingAttachments: FileAttachment[];
  suggestions: string[];
  reset: () => void;

  // Actions
  addMessage: (message: Message) => void;
  updateLastMessage: (contentDelta: string) => void;
  setMessages: (messages: Message[]) => void;
  setStatus: (status: SystemStatus, message?: string) => void;
  addAttachment: (file: File) => void;
  removeAttachment: (id: string) => void;
  clearAttachments: () => void;
  setSuggestions: (suggestions: string[]) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  status: "idle",
  statusMessage: "",
  isStreaming: false,
  pendingAttachments: [],
  suggestions: [],

  addMessage: (msg) =>
    set((state) => ({
      messages: [...state.messages, msg],
    })),

  setMessages: (newMessages) => {
    console.log(`💾 [Store] setMessages called with ${newMessages.length} items`);
    set({ messages: newMessages });
  },
  updateLastMessage: (delta) =>
    set((state) => {
      const lastMsg = state.messages[state.messages.length - 1];
      if (!lastMsg || lastMsg.role !== "assistant") return state;
      const updatedMsg = { ...lastMsg, content: lastMsg.content + delta };
      return { messages: [...state.messages.slice(0, -1), updatedMsg] };
    }),

  setStatus: (status, message = "") => set({ status, statusMessage: message }),

  addAttachment: (file) => {
    const isImage = file.type.startsWith("image/");
    const attachment: FileAttachment = {
      id: Math.random().toString(36).substring(7),
      name: file.name,
      type: file.type,
      size: file.size,
      file,
      previewUrl: isImage ? URL.createObjectURL(file) : undefined,
    };

    set((state) => ({
      pendingAttachments: [...state.pendingAttachments, attachment],
    }));
  },

  removeAttachment: (id) =>
    set((state) => ({
      pendingAttachments: state.pendingAttachments.filter((a) => a.id !== id),
    })),

  clearAttachments: () => set({ pendingAttachments: [] }),
  setSuggestions: (suggestions) => set({ suggestions }),
  reset: () =>
    set({
      messages: [],
      isStreaming: false,
      pendingAttachments: [],
    }),
}));
