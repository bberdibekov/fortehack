# app/schemas/contract.py
from enum import Enum
from typing import List, Literal, Optional, Union
from pydantic import BaseModel, ConfigDict, Field, RootModel
from pydantic.alias_generators import to_camel

class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
        extra='forbid'
    )

# --- ENUMS ---
class SystemStatus(str, Enum):
    IDLE = 'idle'
    THINKING = 'thinking'
    WORKING = 'working'
    SUCCESS = 'success'

class Priority(str, Enum):
    HIGH = 'High'
    MEDIUM = 'Medium'
    LOW = 'Low'

class ArtifactType(str, Enum):
    CODE = 'code'
    MARKDOWN = 'markdown'
    JSON = 'json'
    HTML = 'html'
    PDF = 'pdf'
    MERMAID = 'mermaid'
    WORKBOOK = 'workbook'
    STORIES = 'stories'

# --- DOMAIN MODELS ---

class ContractUserStory(CamelModel):
    model_config = ConfigDict(title="UserStory")
    
    id: str
    priority: Priority
    estimate: str
    role: str
    action: str
    benefit: str
    description: str = "" 
    goal: str = ""
    # FIX: Removed '= []' default. 
    # This forces TS to generate 'scope: string[]' (Required) instead of 'scope?: string[]'.
    # The Mapper handles providing the empty list.
    scope: List[str] 
    out_of_scope: List[str] 
    acceptance_criteria: List[str]

class UserStoryData(CamelModel):
    model_config = ConfigDict(title="UserStoryData")
    stories: List[ContractUserStory]

class WorkbookItem(CamelModel):
    model_config = ConfigDict(title="WorkbookItem")
    id: str
    text: str

class WorkbookCategory(CamelModel):
    model_config = ConfigDict(title="WorkbookCategory")
    id: str
    title: str  # <--- CONFIRMED: Field is present
    icon: Optional[str] = None
    items: List[WorkbookItem]

class WorkbookData(CamelModel):
    model_config = ConfigDict(title="WorkbookData")
    categories: List[WorkbookCategory]

class ContractArtifact(CamelModel):
    model_config = ConfigDict(title="Artifact") 
    id: str
    type: ArtifactType
    title: str  # <--- CONFIRMED: Field is present
    content: str
    language: Optional[str] = None

# --- WEBSOCKET MESSAGES ---

class StatusUpdatePayload(CamelModel):
    model_config = ConfigDict(title="StatusUpdatePayload")
    status: SystemStatus
    message: str

class MsgStatusUpdate(CamelModel):
    model_config = ConfigDict(title="MsgStatusUpdate")
    type: Literal['STATUS_UPDATE']
    payload: StatusUpdatePayload

class MsgChatDelta(CamelModel):
    model_config = ConfigDict(title="MsgChatDelta")
    type: Literal['CHAT_DELTA']
    payload: str

class MsgSuggestionsUpdate(CamelModel):
    model_config = ConfigDict(title="MsgSuggestionsUpdate")
    type: Literal['SUGGESTIONS_UPDATE']
    payload: List[str]

class MsgArtifactOpen(CamelModel):
    model_config = ConfigDict(title="MsgArtifactOpen")
    type: Literal['ARTIFACT_OPEN']
    payload: ContractArtifact

class MsgArtifactUpdatePayload(CamelModel):
    model_config = ConfigDict(title="ArtifactUpdatePayload")
    id: str
    content: str

class MsgArtifactUpdate(CamelModel):
    model_config = ConfigDict(title="MsgArtifactUpdate")
    type: Literal['ARTIFACT_UPDATE']
    payload: MsgArtifactUpdatePayload

class WebSocketMessage(RootModel):
    model_config = ConfigDict(title="WebSocketMessage")
    root: Union[
        MsgStatusUpdate,
        MsgChatDelta,
        MsgSuggestionsUpdate,
        MsgArtifactOpen,
        MsgArtifactUpdate
    ]

# Container
class FrontendContract(BaseModel):
    websocket_message: WebSocketMessage
    user_story_data: UserStoryData
    workbook_data: WorkbookData