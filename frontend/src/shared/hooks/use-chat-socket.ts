import { useCallback, useEffect, useRef } from "react";
import { useChatStore } from "@/features/chat/stores/chat-store";
import { useArtifactStore } from "@/features/artifacts/stores/artifact-store";
import { MockSocketService } from "@/core/api/mock-socket";
import { type IChatSocket } from "@/core/api/types/generated";

export const useChatSocket = () => {
  const socketRef = useRef<IChatSocket | null>(null);
  const { addMessage, updateLastMessage, setStatus, setSuggestions} = useChatStore();
  const { addArtifact } = useArtifactStore();

  useEffect(() => {
    // Initialize Mock Socket (or Real Socket in production)
    const socket = new MockSocketService();
    socket.connect("ws://localhost:8000/ws");
    socketRef.current = socket;

    socket.onMessage((event) => {
      switch (event.type) {
        case "CHAT_DELTA":
          updateLastMessage(event.payload);
          break;
        case "ARTIFACT_OPEN":
          addArtifact(event.payload);
          break;
        case "STATUS_UPDATE":
          if (typeof event.payload === "object") {
            setStatus(event.payload.status, event.payload.message);
          }
          break;
        case "SUGGESTIONS_UPDATE":
          setSuggestions(event.payload);
          break;
      }
    });

    return () => socket.disconnect();
  }, [addMessage, updateLastMessage, setStatus, addArtifact]);

  // Updated signature to accept files
  const sendMessage = useCallback((content: string, files: File[] = []) => {
    // 1. Optimistic User Message
    addMessage({
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: Date.now(),
      // In a real app, we would process 'files' here to show them in the chat stream
      // e.g., attachments: files.map(f => ({ name: f.name, type: f.type ... }))
    });

    // 2. Prepare Empty Assistant Message (to receive stream)
    setTimeout(() => {
      addMessage({
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "", // Starts empty
        timestamp: Date.now(),
        status: "streaming",
      });
    }, 100);

    // 3. Send to Socket
    // In prod need to upload files via HTTP first, get IDs,
    // and send those IDs along with the text message.
    if (socketRef.current) {
      socketRef.current.sendMessage(content);
    }
  }, [addMessage]);

  return { sendMessage };
};
