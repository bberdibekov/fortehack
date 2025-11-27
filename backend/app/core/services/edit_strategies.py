# app/core/services/edit_strategies.py
from abc import ABC, abstractmethod
from typing import Any, Dict, List
import json
from app.domain.models.artifacts import WorkbookArtifact

class IEditStrategy(ABC):
    @abstractmethod
    def validate_and_parse(self, raw_content: Any) -> Any:
        pass

class MermaidEditStrategy(IEditStrategy):
    def validate_and_parse(self, raw_content: Any) -> Any:
        # Mermaid is simple, but we normalize input types
        if isinstance(raw_content, str):
            return {"code": raw_content, "explanation": "User Edited"}
        
        code = raw_content.get("code")
        if not code:
            raise ValueError("Mermaid content missing 'code' field")
            
        return {"code": code, "explanation": raw_content.get("explanation", "User Edited")}

class UserStoryEditStrategy(IEditStrategy):
    def validate_and_parse(self, raw_content: Any) -> Any:
        # 1. Parse JSON if string
        if isinstance(raw_content, str):
            try:
                data = json.loads(raw_content)
            except json.JSONDecodeError:
                raise ValueError("Invalid JSON string")
        else:
            data = raw_content

        # 2. Extract List
        # Frontend sends { "stories": [...] }
        raw_list = data.get("stories", []) if isinstance(data, dict) else data
        if not isinstance(raw_list, list):
             raise ValueError("Stories must be a list")

        # 3. NORMALIZE (Camel -> Snake)
        normalized_stories = []
        for item in raw_list:
            # We map External (Camel) -> Internal (Snake)
            # We also handle case where it might ALREADY be snake (if LLM generated it and we are re-saving)
            
            story = {
                "id": item.get("id") or item.get("id", "unknown"),
                "title": item.get("description") or item.get("title", ""), # Contract 'description' maps to Internal 'title'
                
                # The Critical Mappings
                "as_a": item.get("role") or item.get("as_a", ""),
                "i_want_to": item.get("action") or item.get("i_want_to", ""),
                "so_that": item.get("benefit") or item.get("so_that", ""),
                
                "acceptance_criteria": item.get("acceptanceCriteria") or item.get("acceptance_criteria", []),
                
                # Extended Fields
                "priority": item.get("priority", "Medium"),
                "estimate": item.get("estimate", "SP:?"),
                "scope": item.get("scope", []),
                "out_of_scope": item.get("outOfScope") or item.get("out_of_scope", [])
            }
            normalized_stories.append(story)

        return {"stories": normalized_stories}

class WorkbookEditStrategy(IEditStrategy):
    def validate_and_parse(self, raw_content: Any) -> Any:
        # 1. Normalize Input to Dict
        if isinstance(raw_content, str):
            try:
                data = json.loads(raw_content)
            except json.JSONDecodeError:
                raise ValueError("Invalid JSON string in Workbook edit")
        else:
            data = raw_content

        # 2. Strict Structure Validation via Pydantic
        # This protects the storage from corrupted frontend states
        try:
            validated_model = WorkbookArtifact(**data)
            return validated_model.model_dump()
        except Exception as e:
             raise ValueError(f"Workbook validation failed: {str(e)}")

class EditStrategyFactory:
    _strategies = {
        "mermaid_diagram": MermaidEditStrategy(),
        "user_story": UserStoryEditStrategy(),
        "workbook": WorkbookEditStrategy() # Registered
    }

    @classmethod
    def get_strategy(cls, artifact_type: str) -> IEditStrategy:
        return cls._strategies.get(artifact_type, MermaidEditStrategy()) # Default or Error