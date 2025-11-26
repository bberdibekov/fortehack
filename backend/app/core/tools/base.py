from abc import ABC, abstractmethod
from typing import Any, Callable, Dict, Type
from pydantic import BaseModel
from app.domain.models.state import SessionState

class ToolContext:
    def __init__(
        self, 
        state: SessionState, 
        emit_func: Callable, 
        services: Dict[str, Any]
    ):
        self.state = state
        self.emit = emit_func
        self.services = services 

class BaseTool(ABC):
    name: str
    description: str
    input_model: Type[BaseModel]

    @property
    def openai_schema(self) -> Dict[str, Any]:
        """Auto-generates the schema for the LLM Provider"""
        schema = self.input_model.model_json_schema()
        
        # POST-PROCESSING: Ensure Strict Mode Compliance
        # OpenAI requires 'additionalProperties': False on ALL objects
        self._enforce_strict_schema(schema)

        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": schema,
                "strict": True
            }
        }

    def _enforce_strict_schema(self, schema: Dict[str, Any]):
        """
        Recursively ensures strict mode compliance.
        1. Sets additionalProperties = False for type=object
        2. Ensures all properties are in 'required'
        """
        if schema.get("type") == "object":
            # Requirement 1: additionalProperties: false
            schema["additionalProperties"] = False
            
            # Requirement 2: All properties must be required
            properties = schema.get("properties", {})
            if properties:
                schema["required"] = list(properties.keys())

        # Recurse into properties
        for prop in schema.get("properties", {}).values():
            self._enforce_strict_schema(prop)
            
        # Recurse into definitions ($defs)
        if "$defs" in schema:
            for def_schema in schema["$defs"].values():
                self._enforce_strict_schema(def_schema)

    @abstractmethod
    async def execute(self, args: dict, context: ToolContext) -> str:
        pass