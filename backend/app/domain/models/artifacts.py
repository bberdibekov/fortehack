# app/domain/models/artifacts.py
from pydantic import BaseModel, Field
from typing import List, Literal, Optional

class MermaidArtifact(BaseModel):
    code: str = Field(..., description="The raw MermaidJS diagram code")
    explanation: str = Field(..., description="Brief explanation")

class UserStory(BaseModel):
    # Core ID
    id: str
    
    # Content (Snake Case = Internal Standard)
    title: str = ""
    as_a: str
    i_want_to: str
    so_that: str
    acceptance_criteria: List[str] = []
    
    # Extended Metadata (To match Frontend fidelity)
    priority: str = "Medium" 
    estimate: str = "SP:?"
    scope: List[str] = []
    out_of_scope: List[str] = []

class StoryArtifact(BaseModel):
    stories: List[UserStory]


class WorkbookItem(BaseModel):
    id: str = Field(description="Unique ID") 
    text: str = Field(..., description="Content. Use '->' for flows.")

class WorkbookCategory(BaseModel):
    id: str = Field(description="Unique ID")
    title: str = Field(..., description="Category Title")
    icon: Optional[str] = Field(None, description="Icon key: target, users, activity, process")
    items: List[WorkbookItem]

class WorkbookArtifact(BaseModel):
    categories: List[WorkbookCategory]