# app/domain/models/state.py
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Any, Dict

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

# --- 3. The Source of Truth (The full state) ---
class SessionState(BaseModel):
    session_id: str
    chat_history: List[Dict[str, Any]] = []
    
    # The Ledger
    project_scope: Optional[str] = None
    actors: List[Persona] = []
    goal: Optional[BusinessGoal] = None
    process_steps: List[ProcessStep] = []
    
    # Artifacts Storage
    # Key: The Versioned ID (e.g., 'mermaid_diagram-v1', 'user_story-v3')
    # Value: The content dict (raw output from agent)
    artifacts: Dict[str, Any] = {}

    # Sequence Counters (For Versioning)
    # Key: Artifact Type (e.g., 'mermaid_diagram')
    # Value: Latest Version Integer (e.g., 1)
    # This guarantees we never reuse an ID or overwrite history.
    artifact_counters: Dict[str, int] = {}