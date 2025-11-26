/* eslint-disable */

export type WebSocketMessage =
  | MsgStatusUpdate
  | MsgChatDelta
  | MsgSuggestionsUpdate
  | MsgArtifactOpen
  | MsgArtifactUpdate;
export type SystemStatus = "idle" | "thinking" | "working" | "success";
export type ArtifactType = "code" | "markdown" | "json" | "html" | "pdf" | "mermaid" | "workbook" | "stories";
export type Language = string | null;
export type Priority = "High" | "Medium" | "Low";
export type Stories = UserStory[];
export type Icon = string | null;
export type Items = WorkbookItem[];
export type Categories = WorkbookCategory[];

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
