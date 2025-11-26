# app/core/llm/interface.py
from abc import ABC, abstractmethod
from typing import List, Dict, Type, TypeVar, Optional, Any
from pydantic import BaseModel
from app.core.llm.types import LLMResponse

T = TypeVar('T', bound=BaseModel)

class ILLMClient(ABC):
    @abstractmethod
    async def get_structured_completion(
        self, 
        messages: List[Dict[str, str]], 
        response_model: Type[T],
        temperature: Optional[float] = None,
        model: Optional[str] = None
    ) -> T:
        pass

    @abstractmethod
    async def get_text_completion(
        self, 
        messages: List[Dict[str, str]], 
        temperature: Optional[float] = None,
        model: Optional[str] = None
    ) -> str:
        pass

    @abstractmethod
    async def chat_with_tools(
        self, 
        messages: List[Dict[str, str]], 
        tools_schema: List[Dict[str, Any]],
    ) -> LLMResponse:
        """
        Generic method for any provider (OpenAI, Anthropic, Gemini).
        Returns a standardized LLMResponse object.
        """
        pass