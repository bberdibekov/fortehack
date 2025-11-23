# src\core\extraction\interface.py
from abc import ABC, abstractmethod
from src.core.domain.models import AnalystNotebook

class IRequirementExtractor(ABC):
    """
    Interface for the 'Silent Extraction' engine.
    Implementations can use OpenAI, Anthropics, Local Llama, or RegEx.
    """
        
    @abstractmethod
    def extract(self, current_state: AnalystNotebook, user_input: str) -> AnalystNotebook:
        """
        Analyzes the user input and updates the notebook state.
        """
        pass

  