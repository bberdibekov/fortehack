# src/core/llm/interface.py
from abc import ABC, abstractmethod
from typing import List, Dict, Type, TypeVar, Optional
from pydantic import BaseModel

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