import { useEffect } from "react";
import { useChatStore } from "@/features/chat/stores/chat-store";
import { useArtifactStore } from "@/features/artifacts/stores/artifact-store";
import { socketService } from "@/core/api/live-socket"; 

export const useSocketEvents = () => {
  const { updateLastMessage, setStatus, setSuggestions, addMessage } = useChatStore();
  const { addArtifact, updateArtifactContent } = useArtifactStore();

  useEffect(() => {
    // 1. Setup Identity & Connect
    let clientId = localStorage.getItem("app_client_id");
    if (!clientId) {
      clientId = "client_" + Math.random().toString(36).substring(7);
      localStorage.setItem("app_client_id", clientId);
    }

    // Connect Singleton
    socketService.connect(`ws://localhost:8000/ws/${clientId}`);

    // 2. Register Global Event Handler
    const unsubscribe = socketService.onMessage((event: any) => {
      // console.log("📩 Event:", event.type);
      
      switch (event.type) {
        case "CHAT_DELTA":
          updateLastMessage(event.payload);
          break;

        case "ARTIFACT_OPEN":
          addArtifact(event.payload);
          break;
        
        case "ARTIFACT_UPDATE":
           if (event.payload && event.payload.id && event.payload.content) {
               updateArtifactContent(event.payload.id, event.payload.content);
           }
           break;

        case "STATUS_UPDATE":
          const statusPayload = typeof event.payload === "string" 
            ? { status: event.payload, message: "" } 
            : event.payload;
          // @ts-ignore
          setStatus(statusPayload.status, statusPayload.message);
          break;

        case "SUGGESTIONS_UPDATE":
          setSuggestions(event.payload);
          break;
      }
    });

    // Cleanup listener on unmount (app close), but usually MainLayout doesn't unmount.
    return () => {
      unsubscribe();
    };
  }, [updateLastMessage, setStatus, setSuggestions, addArtifact, updateArtifactContent]);
};