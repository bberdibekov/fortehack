from abc import ABC, abstractmethod
from src.core.domain.models import StrategyResult, AnalystNotebook

class IActionStrategy(ABC):
    """
    Defines WHAT the Agent can do.
    """
    @abstractmethod
    def execute(self, user_input: str, language: str, notebook: AnalystNotebook) -> StrategyResult:
        """
        Executes the strategy logic.
        Now receives the Notebook State to perform validation/gatekeeping.
        """
        pass