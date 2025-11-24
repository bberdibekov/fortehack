import { type Artifact } from "@/features/artifacts/stores/artifact-store";

export type WebSocketMessage = 
  | { type: 'CHAT_DELTA'; payload: string }
  | { type: 'ARTIFACT_OPEN'; payload: Artifact }
  | { type: 'STATUS_UPDATE'; payload: { status: 'idle' | 'thinking' | 'working' | 'success', message: string } }
  | { type: 'SUGGESTIONS_UPDATE'; payload: string[] };

export interface IChatSocket {
  connect: (url: string) => void;
  disconnect: () => void;
  sendMessage: (text: string) => void;
  onMessage: (callback: (msg: WebSocketMessage) => void) => void;
}