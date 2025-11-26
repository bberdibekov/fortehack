from abc import ABC, abstractmethod
from enum import IntEnum
from dataclasses import dataclass
from typing import Optional, List
from app.domain.models.state import SessionState

class GapSeverity(IntEnum):
    # Higher number = Higher Priority
    INFO = 1
    WARNING = 2
    CRITICAL = 3
    BLOCKER = 4

@dataclass
class GapIssue:
    field: str
    severity: GapSeverity
    advice: str
    missing_data: bool = True

class IGapRule(ABC):
    """
    Interface for all Validation Strategies.
    """
    @abstractmethod
    def evaluate(self, state: SessionState) -> Optional[GapIssue]:
        pass