# src\core\domain\models.py
from dataclasses import dataclass
from typing import List, Dict, Any, Optional, Literal
from pydantic import BaseModel, Field
import time
import uuid

# --- PURE DOMAIN ENTITIES (Pydantic) ---

class ExtractionSlot(BaseModel):
    value: str = Field(..., description="The extracted content")
    source: Literal["USER", "INFERRED", "DEFAULT"] = Field(
        "INFERRED", description="Where this info came from"
    )
    confidence: float = Field(
        0.0, description="Confidence score (0.0 to 1.0)"
    )

class AnalystNotebook(BaseModel):
    # 1. Context
    goal: Optional[ExtractionSlot] = None
    
    # 2. Actors (Lists of slots)
    actors: List[ExtractionSlot] = Field(default_factory=list)
    
    # 3. Process Logic
    happy_path: List[ExtractionSlot] = Field(default_factory=list)
    exceptions: List[ExtractionSlot] = Field(default_factory=list)
    
    # 4. Data & Metrics
    data_entities: List[ExtractionSlot] = Field(default_factory=list)
    kpis: List[ExtractionSlot] = Field(default_factory=list)

# --- NEW: SESSION AGGREGATE ---
class SessionData(BaseModel):
    """
    Represents the full state of a user session for serialization.
    """
    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = Field(default="New Session")
    created_at: float = Field(default_factory=time.time)
    last_updated: float = Field(default_factory=time.time)
    
    # State components
    language: str
    notebook: AnalystNotebook
    messages: List[Dict[str, Any]]
    diagram_code: str

# --- INTERACTION OBJECTS (DTOs) ---

@dataclass
class StrategyResult:
    message_key: str              
    diagram_code: str             
    data_rows: List[Dict[str, Any]] 
    updated_notebook: Optional[AnalystNotebook] = None