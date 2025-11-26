# app/core/services/artifact_strategies.py
import json
from abc import ABC, abstractmethod
from typing import Any, Dict

from app.domain.models.artifacts import UserStory as InternalStory
from app.schemas.contract import (
    ContractArtifact, 
    ArtifactType, 
    ContractUserStory, 
    Priority
)

class IArtifactStrategy(ABC):
    @abstractmethod
    def map(self, content: Any, doc_id: str) -> ContractArtifact:
        """Maps raw content to a ContractArtifact."""
        pass

class UserStoryStrategy(IArtifactStrategy):
    def map(self, content: Any, doc_id: str) -> ContractArtifact:
        # 1. Parse Content (Expect Dict with 'stories' list)
        stories_data = content.get("stories", []) if isinstance(content, dict) else []
        
        # 2. Map Internal -> Contract
        mapped_stories = []
        for s in stories_data:
            # Handle dict vs object input
            data = s if isinstance(s, dict) else s.__dict__
            
            # Inline mapping (or call a shared helper if complex)
            # For simplicity, we implement the mapping here or import the DomainMapper helper
            # To avoid circular imports, we'll implement a simple mapper here
            mapped_stories.append(self._map_single_story(data))
            
        # 3. Serialize Container
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
        return ContractUserStory(
            id=data.get("id", "unknown"),
            priority=Priority.MEDIUM, # Default
            estimate="SP:?",
            role=data.get("as_a", ""),
            action=data.get("i_want_to", ""),
            benefit=data.get("so_that", ""),
            description=data.get("title", ""),
            scope=data.get("scope") or [],
            out_of_scope=data.get("out_of_scope") or [],
            acceptance_criteria=data.get("acceptance_criteria") or []
        )

class MermaidStrategy(IArtifactStrategy):
    def map(self, content: Any, doc_id: str) -> ContractArtifact:
        # Expecting dict {'code': '...'} or raw string
        code = content.get("code", "") if isinstance(content, dict) else str(content)
        
        return ContractArtifact(
            id=doc_id,
            type=ArtifactType.MERMAID,
            title="Process Visualization",
            content=code
        )

class DefaultStrategy(IArtifactStrategy):
    def map(self, content: Any, doc_id: str) -> ContractArtifact:
        return ContractArtifact(
            id=doc_id,
            type=ArtifactType.MARKDOWN,
            title="Generated Document",
            content=str(content)
        )

class ArtifactStrategyFactory:
    """Registry for strategies"""
    _strategies: Dict[str, IArtifactStrategy] = {
        "user_story": UserStoryStrategy(),
        "mermaid_diagram": MermaidStrategy()
    }

    @classmethod
    def get_strategy(cls, artifact_type: str) -> IArtifactStrategy:
        return cls._strategies.get(artifact_type, DefaultStrategy())