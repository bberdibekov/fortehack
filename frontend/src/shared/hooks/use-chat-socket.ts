import { useCallback } from "react";
import { useChatStore } from "@/features/chat/stores/chat-store";
import { socketService } from "@/core/api/live-socket"; 

export const useChatSocket = () => {
  const { addMessage } = useChatStore();

  const sendMessage = useCallback((content: string, files: File[] = []) => {
    addMessage({
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: Date.now(),
    });
    socketService.sendMessage(content);
  }, [addMessage]);

  const saveArtifact = useCallback((id: string, content: string) => {
    socketService.send("ARTIFACT_EDIT", { id, content });
  }, []);

  const saveArtifactVisual = useCallback((id: string, visualData: string) => {
    socketService.send("ARTIFACT_VISUAL_SYNC", {
      id: id,
      visual_data: visualData,
      format: 'svg'
    });
  }, []);

  const publishProject = useCallback(() => {
    console.log("📤 Requesting Global Project Publish");
    socketService.send("PROJECT_PUBLISH", {
      target: "confluence"
    });
  }, []);

  return { sendMessage, saveArtifact, saveArtifactVisual, publishProject };
};