# app/core/interfaces/repository.py
from abc import ABC, abstractmethod
from typing import Optional
from app.domain.models.state import SessionState

class ISessionRepository(ABC):
    """
    Interface for Session Persistence.
    Decouples domain logic from storage implementation (Memory/Redis/SQL).
    """

    @abstractmethod
    async def get(self, session_id: str) -> Optional[SessionState]:
        """Retrieve a session by ID. Returns None if not found."""
        pass

    @abstractmethod
    async def save(self, state: SessionState) -> None:
        """Persist the session state."""
        pass
    
    @abstractmethod
    async def delete(self, session_id: str) -> None:
        """Remove a session (useful for cleanup)."""
        pass