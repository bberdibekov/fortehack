import { useEffect, useRef } from "react";
import { type Message, useChatStore } from "@/features/chat/stores/chat-store";
import { useArtifactStore } from "@/features/artifacts/stores/artifact-store";
import { socketService } from "@/core/api/live-socket";

export const useSocketEvents = () => {
  const { updateLastMessage, setStatus, setSuggestions, setMessages } =
    useChatStore();
  const { addArtifact, updateArtifactContent, setArtifactSyncStatus } =
    useArtifactStore();

  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let clientId = localStorage.getItem("app_client_id");
    if (!clientId) {
      clientId = "client_" + Math.random().toString(36).substring(7);
      localStorage.setItem("app_client_id", clientId);
    }

    socketService.connect(`ws://localhost:8000/ws/${clientId}`);

    const unsubscribe = socketService.onMessage((event: any) => {
      switch (event.type) {
        case "CHAT_HISTORY":
          console.log("📜 [Handler] Handling CHAT_HISTORY", event.payload);
          // Handle both Array and Object wrapper
          const rawMessages = Array.isArray(event.payload)
            ? event.payload
            : event.payload?.messages;

          if (Array.isArray(rawMessages)) {
            const hydratedMessages: Message[] = rawMessages.map((
              msg: any,
              index: number,
            ) => ({
              id: `hist-${index}-${Date.now()}`,
              role: msg.role,
              content: msg.content,
              timestamp: Date.now(),
              status: "complete",
            }));

            console.log(`✅ Hydrating ${hydratedMessages.length} messages...`);
            setMessages(hydratedMessages);
          } else {
            console.warn(
              "⚠️ [Handler] CHAT_HISTORY payload structure mismatch:",
              event.payload,
            );
          }
          break;

        case "ARTIFACT_OPEN":
          addArtifact(event.payload);
          break;

        case "ARTIFACT_UPDATE":
          if (event.payload && event.payload.id && event.payload.content) {
            updateArtifactContent(event.payload.id, event.payload.content);
          }
          break;

        case "ARTIFACT_SYNC_EVENT":
          const { id, status, message } = event.payload;
          if (id && status) {
            setArtifactSyncStatus(id, status, message);
            if (status === "synced") {
              setTimeout(() => {
                // Optional fade out logic
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

          if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
          if (
            statusPayload.status === "success" ||
            statusPayload.status === "error"
          ) {
            statusTimerRef.current = setTimeout(() => {
              setStatus("idle", "");
            }, 5000);
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
    setMessages,
  ]);
};
