import * as Schema from "./schema";

// --- 1. Re-export Domain Types ---
export type {
  Artifact,
  ArtifactSyncPayload,
  ArtifactSyncStatus,
  ArtifactType,
  MsgArtifactSync,
  Priority,
  SystemStatus,
  UserStory,
  UserStoryData,
  WorkbookCategory,
  WorkbookData,
  WorkbookItem,
  MsgChatHistory,
  ChatHistoryPayload,
  ChatMessage, 
  MsgSessionEstablished,
  SessionEstablishedPayload
} from "./schema";

export type { WebSocketMessage } from "./schema";

export interface IChatSocket {
  connect: (url: string) => void;
  disconnect: () => void;
  sendMessage: (text: string) => void;
  onMessage: (callback: (msg: Schema.WebSocketMessage) => void) => void;
}