# app/core/tools/inputs.py
from typing import List, Optional, Literal, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field, ConfigDict
from app.domain.models.state import Persona, BusinessGoal, ProcessStep, DataEntity, NonFunctionalRequirement

# --- ENUMS for Search Tools ---
class SearchableArtifact(str, Enum):
    USER_STORY = "user_story"
    USE_CASE = "use_case"
    WORKBOOK = "workbook"

# --- TOOL INPUT MODELS ---

class UpdateRequirementsInput(BaseModel):
    """
    Input schema for the update_requirements tool.
    Supports Adding, Updating, and Removing data.
    """
    model_config = ConfigDict(extra='forbid') 
    
    project_scope: Optional[str] = Field(None, description="The high-level scope of the project.")
    
    # Actors
    actors_to_add: List[Persona] = Field(default=[], description="List of NEW actors to add.")
    actors_to_remove: List[str] = Field(default=[], description="List of Role Names to remove (e.g. ['Sales Manager']).")
    
    # Goal
    goal: Optional[BusinessGoal] = Field(None, description="The business goal.")
    
    # Steps
    process_steps: List[ProcessStep] = Field(default=[], description="The list of process steps (overwrites existing if IDs match, otherwise adds).")
    steps_to_remove: List[int] = Field(default=[], description="List of Step IDs to remove.")

    # Data & NFRs (New Enterprise Capabilities)
    data_entities: List[DataEntity] = Field(default=[], description="New or updated data entities identified (e.g., 'Loan Application' with fields).")
    nfrs: List[NonFunctionalRequirement] = Field(default=[], description="New system constraints / NFRs.")

class TriggerVisualizationInput(BaseModel):
    model_config = ConfigDict(extra='forbid')
    
    artifact_types: List[Literal['mermaid_diagram', 'user_story', 'workbook', 'use_case']] = Field(
        ..., 
        description="Artifacts to generate. Recommended to request all: ['mermaid_diagram', 'user_story', 'workbook', 'use_case'] for full analysis."
    )

class InspectArtifactInput(BaseModel):
    model_config = ConfigDict(extra='forbid')
    
    artifact_type: Literal['user_story', 'use_case', 'workbook'] = Field(..., description="...")
    query: str = Field(..., description="Keywords to find the item (e.g., 'Login story', 'Risk Officer').")

class PatchArtifactInput(BaseModel):
    model_config = ConfigDict(extra='forbid')
    
        
    artifact_type: Literal['user_story', 'use_case', 'workbook'] = Field(..., description="...")
    search_key: str = Field(..., description="The title or ID of the item to update (e.g., 'Login Page').")
    updates_json: str = Field(..., description="A JSON string representing the key-value pairs to update. Example: '{\"estimate\": \"5 SP\", \"priority\": \"High\"}'")