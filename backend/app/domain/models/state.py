from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict
import uuid

# --- 1. Sub-Entities ---
class Persona(BaseModel):
    # Using a name as ID for simplicity in extraction
    role_name: str = Field(..., description="The job title or role, e.g., 'Loan Officer'")
    responsibilities: Optional[str] = Field(None, description="What they do in this process")

class BusinessGoal(BaseModel):
    main_goal: str = Field(..., description="The primary outcome desired")
    success_metrics: List[str] = Field(default_factory=list, description="KPIs or success criteria")

class ProcessStep(BaseModel):
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
    chat_history: List[Dict[str, str]] = []
    
    # The Ledger
    project_scope: Optional[str] = None
    actors: List[Persona] = []
    goal: Optional[BusinessGoal] = None
    process_steps: List[ProcessStep] = []
    
    # Artifacts (Mermaid, etc.)
    artifacts: Dict[str, Any] = {}