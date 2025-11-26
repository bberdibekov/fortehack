import { useCallback, useEffect, useRef } from "react";
import { useChatStore } from "@/features/chat/stores/chat-store";
import { useArtifactStore } from "@/features/artifacts/stores/artifact-store";
import { LiveSocketService } from "@/core/api/live-socket"; 
import { type IChatSocket } from "@/core/api/types/generated";

export const useChatSocket = () => {
  // Use generic type IChatSocket but cast to LiveSocketService when we need .send()
  const socketRef = useRef<LiveSocketService | null>(null);
  
  const { addMessage, updateLastMessage, setStatus, setSuggestions } = useChatStore();
  const { addArtifact } = useArtifactStore();

  useEffect(() => {
    // 1. Generate Client ID
    // In a real app, this might come from a user session or auth token
    let clientId = localStorage.getItem("app_client_id");
    if (!clientId) {
      clientId = "client_" + Math.random().toString(36).substring(7);
      localStorage.setItem("app_client_id", clientId);
    }

    // 2. Initialize Socket
    const socket = new LiveSocketService();
    const url = `ws://localhost:8000/ws/${clientId}`;
    
    socket.connect(url);
    socketRef.current = socket;

    // 3. Handle Incoming Events
    socket.onMessage((event: any) => {
      // console.log("📩 Received:", event.type); // Uncomment for debugging

      switch (event.type) {
        case "CHAT_DELTA":
          // Even though it's the full text, we treat it as an update to the streaming bubble
          updateLastMessage(event.payload);
          break;

        case "ARTIFACT_OPEN":
          addArtifact(event.payload);
          break;

        case "STATUS_UPDATE":
           // Handle both string and object payloads if backend varies
          const statusPayload = typeof event.payload === "string" 
            ? { status: event.payload, message: "" } 
            : event.payload;
          
          // @ts-ignore - types in schema might be strict, ignoring for quick connectivity
          setStatus(statusPayload.status, statusPayload.message);
          break;

        case "SUGGESTIONS_UPDATE":
          setSuggestions(event.payload);
          break;
      }
    });

    return () => socket.disconnect();
  }, [addMessage, updateLastMessage, setStatus, addArtifact, setSuggestions]);

  // --- Actions ---

  const sendMessage = useCallback((content: string, files: File[] = []) => {
    // 1. Optimistic User Message
    addMessage({
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: Date.now(),
    });

    // 2. Prepare Empty Assistant Message (to receive the 'CHAT_DELTA')
    setTimeout(() => {
      addMessage({
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "", 
        timestamp: Date.now(),
        status: "streaming",
      });
    }, 100);

    // 3. Send
    if (socketRef.current) {
      socketRef.current.sendMessage(content);
    }
  }, [addMessage]);

  const saveArtifact = useCallback((type: string, content: string) => {
    if (socketRef.current) {
      console.log(`💾 Saving ${type}...`);
      socketRef.current.send("ARTIFACT_EDIT", {
        type: type, 
        content: content
      });
    }
  }, []);

  return { sendMessage, saveArtifact };
};