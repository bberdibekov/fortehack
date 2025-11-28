# app/domain/models/state.py
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Any, Dict, Literal
import uuid

# --- 1. Sub-Entities ---
class Persona(BaseModel):
    model_config = ConfigDict(extra='forbid')
    # Using a name as ID for simplicity in extraction
    role_name: str = Field(..., description="The job title or role, e.g., 'Loan Officer'")
    responsibilities: Optional[str] = Field(None, description="What they do in this process")

class BusinessGoal(BaseModel):
    model_config = ConfigDict(extra='forbid')
    main_goal: str = Field(..., description="The primary outcome desired")
    success_metrics: List[str] = Field(default_factory=list, description="KPIs or success criteria")

class ProcessStep(BaseModel):
    model_config = ConfigDict(extra='forbid')
    step_id: int
    description: str
    actor: str = Field(..., description="Who performs this step")

class DataEntity(BaseModel):
    model_config = ConfigDict(extra='forbid')
    name: str = Field(..., description="The entity name (e.g. 'Customer', 'Loan Application')")
    description: Optional[str] = Field(None, description="Brief definition")
    fields: List[str] = Field(default=[], description="List of attributes (e.g. ['SSN', 'DOB', 'Address'])")

class NonFunctionalRequirement(BaseModel):
    model_config = ConfigDict(extra='forbid')
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    category: Literal["Security", "Performance", "Reliability", "Compliance", "Usability", "Other"]
    requirement: str = Field(..., description="The constraint statement")


# --- 2. The Extraction Target (What the LLM returns) ---
class ExtractionResult(BaseModel):
    """
    The LLM returns this. All fields are Optional because 
    a single chat message might only contain partial info.
    """
    found_personas: List[Persona] = []
    found_goal: Optional[BusinessGoal] = None
    found_steps: List[ProcessStep] = []
    found_scope: Optional[str] = None
    found_data_entities: List[DataEntity] = []
    found_nfrs: List[NonFunctionalRequirement] = []

# --- 3. The Source of Truth (The full state) ---
class SessionState(BaseModel):
    session_id: str
    chat_history: List[Dict[str, Any]] = []
    
    # The Ledger
    project_scope: Optional[str] = None
    actors: List[Persona] = []
    goal: Optional[BusinessGoal] = None
    process_steps: List[ProcessStep] = []
    data_entities: List[DataEntity] = []
    nfrs: List[NonFunctionalRequirement] = []
    
    # Artifacts Storage
    # Key: The Versioned ID (e.g., 'mermaid_diagram-v1', 'user_story-v3')
    # Value: The content dict (raw output from agent)
    artifacts: Dict[str, Any] = {}

    # Visual Storage (Rendered Content)
    # Key: 'mermaid_diagram-v1', Value: "<svg>...</svg>"
    # We store it against the specific version so we have history.
    visual_artifacts: Dict[str, str] = {}

    # Sequence Counters (For Versioning)
    # Key: Artifact Type (e.g., 'mermaid_diagram')
    # Value: Latest Version Integer (e.g., 1)
    # This guarantees we never reuse an ID or overwrite history.
    artifact_counters: Dict[str, int] = {}