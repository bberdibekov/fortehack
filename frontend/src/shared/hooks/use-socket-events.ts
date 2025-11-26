import { useEffect, useRef } from "react";
import { useChatStore } from "@/features/chat/stores/chat-store";
import { useArtifactStore } from "@/features/artifacts/stores/artifact-store";
import { socketService } from "@/core/api/live-socket";

export const useSocketEvents = () => {
  const { updateLastMessage, setStatus, setSuggestions } = useChatStore();
  const { addArtifact, updateArtifactContent, setArtifactSyncStatus } =
    useArtifactStore();

  // Ref to track the auto-dismiss timer
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // 1. Setup Identity & Connect
    let clientId = localStorage.getItem("app_client_id");
    if (!clientId) {
      clientId = "client_" + Math.random().toString(36).substring(7);
      localStorage.setItem("app_client_id", clientId);
    }

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

        // --- NEW SYNC EVENT ---
        case "ARTIFACT_SYNC_EVENT":
          const { id, status, message } = event.payload;
          if (id && status) {
            setArtifactSyncStatus(id, status, message);

            // Auto-clear "synced" status after 3 seconds for cleanliness
            if (status === "synced") {
              setTimeout(() => {
                // Only clear if it's still synced (user hasn't edited again)
                // This is a bit tricky to check inside timeout closure without refs,
                // but strictly setting to undefined or keeping 'synced' is fine.
                // For now, let's leave it as 'synced' in the store, the UI can decide to fade it out.
              }, 3000);
            }
          }
          break;

        case "STATUS_UPDATE":
          const statusPayload = typeof event.payload === "string"
            ? { status: event.payload, message: "" }
            : event.payload;

          // @ts-ignore
          setStatus(statusPayload.status, statusPayload.message);

          // --- AUTO DISMISS LOGIC (Issue #1) ---
          if (statusTimerRef.current) clearTimeout(statusTimerRef.current);

          if (
            statusPayload.status === "success" ||
            statusPayload.status === "error"
          ) {
            statusTimerRef.current = setTimeout(() => {
              setStatus("idle", "");
            }, 5000); // 5 seconds after success, go idle
          }
          break;

        case "SUGGESTIONS_UPDATE":
          setSuggestions(event.payload);
          break;
      }
    });

    return () => {
      unsubscribe();
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    };
  }, [
    updateLastMessage,
    setStatus,
    setSuggestions,
    addArtifact,
    updateArtifactContent,
    setArtifactSyncStatus,
  ]);
};
