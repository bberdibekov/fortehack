# app/schemas/contract.py
from enum import Enum
from typing import List, Literal, Optional, Union
from pydantic import BaseModel, ConfigDict, Field, RootModel
from pydantic.alias_generators import to_camel

# --- Base Configuration ---
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

# 1. User Stories
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
    # Frontend requirement: Strictly typed arrays (string[]), not optional (string[] | undefined)
    # The Mapper MUST provide these lists (even if empty).
    scope: List[str] 
    out_of_scope: List[str] 
    acceptance_criteria: List[str]

class UserStoryData(CamelModel):
    model_config = ConfigDict(title="UserStoryData")
    stories: List[ContractUserStory]

# 2. Analyst Workbook
class WorkbookItem(CamelModel):
    model_config = ConfigDict(title="WorkbookItem")
    id: str
    text: str

class WorkbookCategory(CamelModel):
    model_config = ConfigDict(title="WorkbookCategory")
    id: str
    title: str
    icon: Optional[str] = None
    items: List[WorkbookItem]

class WorkbookData(CamelModel):
    model_config = ConfigDict(title="WorkbookData")
    categories: List[WorkbookCategory]

# 3. Artifact Wrapper
class ContractArtifact(CamelModel):
    model_config = ConfigDict(title="Artifact") 
    id: str
    type: ArtifactType
    title: str
    content: str
    language: Optional[str] = None

# --- STATE SNAPSHOT MODELS (For State Update) ---

class ContractPersona(CamelModel):
    model_config = ConfigDict(title="Persona")
    role_name: str
    responsibilities: Optional[str] = None

class ContractStep(CamelModel):
    model_config = ConfigDict(title="ProcessStep")
    step_id: int
    actor: str
    description: str

class ContractGoal(CamelModel):
    model_config = ConfigDict(title="BusinessGoal")
    main_goal: str
    success_metrics: List[str] = []

class ContractStateSnapshot(CamelModel):
    model_config = ConfigDict(title="StateSnapshot")
    session_id: str
    project_scope: Optional[str] = None
    actors: List[ContractPersona] = []
    process_steps: List[ContractStep] = []
    goal: Optional[ContractGoal] = None

# --- VALIDATION MODELS (For Validation Warn) ---

class ValidationIssue(CamelModel):
    model_config = ConfigDict(title="ValidationIssue")
    severity: str 
    # We relax this to str in the Contract to prevent serialization errors
    # The Frontend will type it as string, which is safe.
    category: str = "policy" 
    message: str

class ValidationWarnPayload(CamelModel):
    model_config = ConfigDict(title="ValidationWarnPayload")
    issues: List[ValidationIssue]
    safety_score: int = 100

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

class MsgStateUpdate(CamelModel):
    model_config = ConfigDict(title="MsgStateUpdate")
    type: Literal['STATE_UPDATE']
    payload: ContractStateSnapshot

class MsgValidationWarn(CamelModel):
    model_config = ConfigDict(title="MsgValidationWarn")
    type: Literal['VALIDATION_WARN']
    payload: ValidationWarnPayload

# --- ROOT UNION (Exported as WebSocketMessage) ---

class WebSocketMessage(RootModel):
    model_config = ConfigDict(title="WebSocketMessage")
    root: Union[
        MsgStatusUpdate,
        MsgChatDelta,
        MsgSuggestionsUpdate,
        MsgArtifactOpen,
        MsgArtifactUpdate,
        MsgStateUpdate,    # New
        MsgValidationWarn  # New
    ]

# --- CONTAINER (For Generation Script) ---

class FrontendContract(BaseModel):
    """
    This class is never instantiated in the app.
    It exists solely to aggregate all types so the generation script 
    exports everything in one go.
    """
    websocket_message: WebSocketMessage
    user_story_data: UserStoryData
    workbook_data: WorkbookData