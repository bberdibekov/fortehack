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
  ChatHistoryPayload
} from "./schema";

// --- 2. Clean up WebSocket Message Type ---
export type { WebSocketMessage } from "./schema";

// --- 3. Add the Socket Interface ---
// Since the generator defines Data, not Behavior, we define the Interface here
// so the rest of the app imports everything from one place.
export interface IChatSocket {
  connect: (url: string) => void;
  disconnect: () => void;
  sendMessage: (text: string) => void;
  onMessage: (callback: (msg: Schema.WebSocketMessage) => void) => void;
}
