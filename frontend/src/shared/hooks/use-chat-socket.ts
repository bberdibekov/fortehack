import { useCallback } from "react";
import { useChatStore } from "@/features/chat/stores/chat-store";
import { socketService } from "@/core/api/live-socket"; 

export const useChatSocket = () => {
  const { addMessage } = useChatStore();

  const sendMessage = useCallback((content: string, files: File[] = []) => {
    // 1. Optimistic User Message
    addMessage({
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: Date.now(),
    });


    // 3. Send via Singleton
    socketService.sendMessage(content);
  }, [addMessage]);

  const saveArtifact = useCallback((id: string, content: string) => {
    socketService.send("ARTIFACT_EDIT", {
      id: id, 
      content: content
    });
  }, []);

  return { sendMessage, saveArtifact };
};