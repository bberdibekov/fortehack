import { useEffect, useRef } from "react";
import { type Message, useChatStore } from "@/features/chat/stores/chat-store";
import { useArtifactStore } from "@/features/artifacts/stores/artifact-store";
import { socketService } from "@/core/api/live-socket";
import { getClientId, getSessionId, setSessionId } from "@/shared/utils/session-manager";
import { type ChatMessage as WireMessage } from "@/core/api/types/generated";

export const useSocketEvents = () => {
  const { updateLastMessage, setStatus, setSuggestions, setMessages, messages, addMessage } =
    useChatStore();
  const { addArtifact, updateArtifactContent, setArtifactSyncStatus } =
    useArtifactStore();

  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const clientId = getClientId();
    const sessionId = getSessionId();

    const baseUrl = `ws://localhost:8000/ws/${clientId}`;
    const socketUrl = sessionId 
        ? `${baseUrl}?session_id=${sessionId}`
        : baseUrl;

    socketService.connect(socketUrl);

    const unsubscribe = socketService.onMessage((event: any) => {
      switch (event.type) {
        case "SESSION_ESTABLISHED":
          if (event.payload?.sessionId) {
             setSessionId(event.payload.sessionId);
          }
          break;

        case "CHAT_HISTORY":
          console.log("📜 [Handler] Handling CHAT_HISTORY");
          let rawMessages: WireMessage[] = [];
          
          if (Array.isArray(event.payload)) {
             rawMessages = event.payload;
          } else if (event.payload?.messages && Array.isArray(event.payload.messages)) {
             rawMessages = event.payload.messages;
          }

          const hydratedMessages: Message[] = rawMessages.map((msg, index) => {
            const safeRole = (msg.role === 'user' || msg.role === 'assistant' || msg.role === 'system') 
                ? msg.role 
                : 'system';

            return {
              id: `hist-${index}-${Date.now()}`,
              role: safeRole,
              content: msg.content || "",
              timestamp: Date.now(),
              status: "complete",
            };
          });
          setMessages(hydratedMessages);
          break;

        case "CHAT_DELTA":
          const currentMessages = useChatStore.getState().messages;
          const lastMsg = currentMessages[currentMessages.length - 1];

          // If no message exists or last message is User, creates a new Assistant bubble
          if (!lastMsg || lastMsg.role !== 'assistant') {
             addMessage({
                id: Date.now().toString(),
                role: 'assistant',
                content: event.payload,
                timestamp: Date.now(),
                status: 'streaming'
             });
          } else {
             // Otherwise, append to existing
             updateLastMessage(event.payload);
          }
          break;
        // ----------------------------------

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
    addMessage 
  ]);
};