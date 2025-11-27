# app/core/services/artifact_strategies.py
import json
from abc import ABC, abstractmethod
from typing import Any, Dict

from app.schemas.contract import (
    ContractArtifact, 
    ArtifactType, 
    ContractUserStory, 
    Priority
)

class IArtifactStrategy(ABC):
    @abstractmethod
    def map(self, content: Any, doc_id: str) -> ContractArtifact:
        pass

class UserStoryStrategy(IArtifactStrategy):
    def map(self, content: Any, doc_id: str) -> ContractArtifact:
        # Content is guaranteed to be a Dict with "stories" key due to our EditStrategy
        stories_data = content.get("stories", []) if isinstance(content, dict) else []
        
        mapped_stories = []
        for data in stories_data:
            mapped_stories.append(self._map_single_story(data))
            
        json_content = json.dumps({
            "stories": [s.model_dump(by_alias=True) for s in mapped_stories]
        })

        return ContractArtifact(
            id=doc_id,
            type=ArtifactType.STORIES,
            title="User Stories",
            content=json_content
        )

    def _map_single_story(self, data: dict) -> ContractUserStory:
        # Robust Mapping: Read from normalized keys
        
        # Handle Priority Enum Safely
        raw_prio = data.get("priority", "Medium")
        try:
            prio_enum = Priority(raw_prio)
        except ValueError:
            prio_enum = Priority.MEDIUM

        return ContractUserStory(
            id=data.get("id", "unknown"),
            priority=prio_enum, # Use stored value
            estimate=data.get("estimate", "SP:?"), # Use stored value
            
            role=data.get("as_a", ""),
            action=data.get("i_want_to", ""),
            benefit=data.get("so_that", ""),
            
            description=data.get("title", ""), # Internal 'title' -> Contract 'description'
            
            scope=data.get("scope", []),
            out_of_scope=data.get("out_of_scope", []),
            acceptance_criteria=data.get("acceptance_criteria", [])
        )

class MermaidStrategy(IArtifactStrategy):
    def map(self, content: Any, doc_id: str) -> ContractArtifact:
        code = content.get("code", "") if isinstance(content, dict) else str(content)
        
        return ContractArtifact(
            id=doc_id,
            type=ArtifactType.MERMAID,
            title="Process Visualization",
            content=code
        )

class WorkbookStrategy(IArtifactStrategy):
    def map(self, content: Any, doc_id: str) -> ContractArtifact:
        # Content can be a Pydantic Model (from Agent) or a Dict (from Storage)
        if hasattr(content, "model_dump_json"):
            # Pydantic Model -> JSON String
            json_content = content.model_dump_json()
        elif isinstance(content, dict):
            # Dict -> JSON String
            json_content = json.dumps(content)
        else:
            # Fallback
            json_content = json.dumps({"categories": []})

        return ContractArtifact(
            id=doc_id,
            type=ArtifactType.WORKBOOK,
            title="Analyst Workbook",
            content=json_content
        )

class UseCaseStrategy(IArtifactStrategy):
    def map(self, content: Any, doc_id: str) -> ContractArtifact:
        if hasattr(content, "model_dump_json"):
            json_content = content.model_dump_json()
        elif isinstance(content, dict):
            json_content = json.dumps(content)
        else:
            json_content = json.dumps({"use_cases": []})

        return ContractArtifact(
            id=doc_id,
            type=ArtifactType.USE_CASE,
            title="Use Cases",
            content=json_content
        )

class ArtifactStrategyFactory:
    _strategies = {
        "user_story": UserStoryStrategy(),
        "mermaid_diagram": MermaidStrategy(),
        "workbook": WorkbookStrategy(),
        "use_case": UseCaseStrategy()
    }

    @classmethod
    def get_strategy(cls, artifact_type: str) -> IArtifactStrategy:
        return cls._strategies.get(artifact_type, MermaidStrategy())