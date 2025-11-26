# app/core/services/edit_strategies.py
from abc import ABC, abstractmethod
from typing import Any, Dict
import json

class IEditStrategy(ABC):
    @abstractmethod
    def validate_and_parse(self, raw_content: Any) -> Any:
        """
        Validates incoming user content. 
        Returns the data structure to be stored in SessionState.
        Raises ValueError if invalid.
        """
        pass

class MermaidEditStrategy(IEditStrategy):
    def validate_and_parse(self, raw_content: Any) -> Any:
        # Input: String (Mermaid code) or Dict
        code = raw_content if isinstance(raw_content, str) else raw_content.get("code")
        
        if not code or not isinstance(code, str):
            raise ValueError("Invalid Mermaid content: 'code' string is required.")
        
        # We store it in the internal format (Dict)
        return {"code": code, "explanation": "User Edited"}

class UserStoryEditStrategy(IEditStrategy):
    def validate_and_parse(self, raw_content: Any) -> Any:
        # Input: JSON string or List
        if isinstance(raw_content, str):
            try:
                data = json.loads(raw_content)
            except json.JSONDecodeError:
                raise ValueError("Invalid JSON format for User Stories")
        else:
            data = raw_content

        # Basic Schema Check
        if not isinstance(data, dict) or "stories" not in data:
             # Fallback if frontend sends raw list
             if isinstance(data, list):
                 return {"stories": data}
             raise ValueError("User Stories must be a list or wrapped in {stories: []}")

        return data

# --- Factory / Registry ---
class EditStrategyFactory:
    _strategies = {
        "mermaid_diagram": MermaidEditStrategy(),
        "user_story": UserStoryEditStrategy()
    }

    @classmethod
    def get_strategy(cls, artifact_type: str) -> IEditStrategy:
        strategy = cls._strategies.get(artifact_type)
        if not strategy:
            raise ValueError(f"No edit strategy defined for {artifact_type}")
        return strategy