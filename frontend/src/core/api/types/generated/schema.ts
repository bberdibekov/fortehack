/* eslint-disable */

export type WebSocketMessage =
  | MsgStatusUpdate
  | MsgChatDelta
  | MsgSuggestionsUpdate
  | MsgArtifactOpen
  | MsgArtifactUpdate
  | MsgStateUpdate
  | MsgValidationWarn
  | MsgArtifactSync
  | MsgChatHistory
  | MsgSessionEstablished;
export type SystemStatus = "idle" | "thinking" | "working" | "success";
export type ArtifactType = "code" | "markdown" | "json" | "html" | "pdf" | "mermaid" | "workbook" | "stories";
export type Language = string | null;
export type Projectscope = string | null;
export type Responsibilities = string | null;
export type Actors = Persona[];
export type Processsteps = ProcessStep[];
export type Issues = ValidationIssue[];
export type ArtifactSyncStatus = "saving" | "processing" | "synced" | "error";
export type Message = string | null;
export type Messages = ChatMessage[];
export type Priority = "High" | "Medium" | "Low";
export type Stories = UserStory[];
export type Icon = string | null;
export type Items = WorkbookItem[];
export type Categories = WorkbookCategory[];

/**
 * This class is never instantiated in the app.
 * It exists solely to aggregate all types so the generation script
 * exports everything in one go.
 */
export interface FrontendContract {
  websocket_message: WebSocketMessage;
  user_story_data: UserStoryData;
  workbook_data: WorkbookData;
  [k: string]: unknown;
}
export interface MsgStatusUpdate {
  type: "STATUS_UPDATE";
  payload: StatusUpdatePayload;
}
export interface StatusUpdatePayload {
  status: SystemStatus;
  message: string;
}
export interface MsgChatDelta {
  type: "CHAT_DELTA";
  payload: string;
}
export interface MsgSuggestionsUpdate {
  type: "SUGGESTIONS_UPDATE";
  payload: string[];
}
export interface MsgArtifactOpen {
  type: "ARTIFACT_OPEN";
  payload: Artifact;
}
export interface Artifact {
  id: string;
  type: ArtifactType;
  title: string;
  content: string;
  language?: Language;
}
export interface MsgArtifactUpdate {
  type: "ARTIFACT_UPDATE";
  payload: ArtifactUpdatePayload;
}
export interface ArtifactUpdatePayload {
  id: string;
  content: string;
}
export interface MsgStateUpdate {
  type: "STATE_UPDATE";
  payload: StateSnapshot;
}
export interface StateSnapshot {
  sessionId: string;
  projectScope?: Projectscope;
  actors?: Actors;
  processSteps?: Processsteps;
  goal?: BusinessGoal | null;
}
export interface Persona {
  roleName: string;
  responsibilities?: Responsibilities;
}
export interface ProcessStep {
  stepId: number;
  actor: string;
  description: string;
}
export interface BusinessGoal {
  mainGoal: string;
  successMetrics?: string[];
}
export interface MsgValidationWarn {
  type: "VALIDATION_WARN";
  payload: ValidationWarnPayload;
}
export interface ValidationWarnPayload {
  issues: Issues;
  safetyScore?: number;
}
export interface ValidationIssue {
  severity: string;
  category?: string;
  message: string;
}
export interface MsgArtifactSync {
  type: "ARTIFACT_SYNC_EVENT";
  payload: ArtifactSyncPayload;
}
export interface ArtifactSyncPayload {
  id: string;
  status: ArtifactSyncStatus;
  message?: Message;
}
export interface MsgChatHistory {
  type: "CHAT_HISTORY";
  payload: ChatHistoryPayload;
}
export interface ChatHistoryPayload {
  messages: Messages;
}
export interface ChatMessage {
  role: string;
  content: string;
}
export interface MsgSessionEstablished {
  type: "SESSION_ESTABLISHED";
  payload: SessionEstablishedPayload;
}
export interface SessionEstablishedPayload {
  sessionId: string;
  isNew: boolean;
}
export interface UserStoryData {
  stories: Stories;
}
export interface UserStory {
  id: string;
  priority: Priority;
  estimate: string;
  role: string;
  action: string;
  benefit: string;
  description?: string;
  goal?: string;
  scope: string[];
  outOfScope: string[];
  acceptanceCriteria: string[];
}
export interface WorkbookData {
  categories: Categories;
}
export interface WorkbookCategory {
  id: string;
  title: string;
  icon?: Icon;
  items: Items;
}
export interface WorkbookItem {
  id: string;
  text: string;
}
