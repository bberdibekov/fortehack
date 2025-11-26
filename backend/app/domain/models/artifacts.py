from pydantic import BaseModel, Field
from typing import List, Literal

class MermaidArtifact(BaseModel):
    code: str = Field(..., description="The raw MermaidJS diagram code (e.g. graph TD...)")
    explanation: str = Field(..., description="Brief explanation of the flow")

class UserStory(BaseModel):
    id: str
    title: str
    as_a: str
    i_want_to: str
    so_that: str
    acceptance_criteria: List[str]

class StoryArtifact(BaseModel):
    stories: List[UserStory]