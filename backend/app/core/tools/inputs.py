# app/core/tools/inputs.py
from typing import List, Optional, Literal
from pydantic import BaseModel, Field, ConfigDict
from app.domain.models.state import Persona, BusinessGoal, ProcessStep

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

class TriggerVisualizationInput(BaseModel):
    # ... (Keep existing)
    model_config = ConfigDict(extra='forbid')
    artifact_types: List[Literal['mermaid_diagram', 'user_story', 'kpi']] = Field(
        ..., 
        description="Which artifacts to generate."
    )