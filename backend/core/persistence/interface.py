# src\core\persistence\interface.py
from abc import ABC, abstractmethod
from typing import List, Optional
from src.core.domain.models import SessionData

class ISessionRepository(ABC):
    """
    Abstract interface for Session Persistence.
    Allows swapping implementations (File -> Redis -> SQL).
    """
    
    @abstractmethod
    def save_session(self, session: SessionData) -> bool:
        """Persist the session data."""
        pass
    
    @abstractmethod
    def load_session(self, session_id: str) -> Optional[SessionData]:
        """Retrieve a session by ID."""
        pass
    
    @abstractmethod
    def list_sessions(self) -> List[dict]:
        """List available sessions (ID, Name, Timestamp)."""
        pass
        
    @abstractmethod
    def delete_session(self, session_id: str) -> bool:
        """Remove a session."""
        pass