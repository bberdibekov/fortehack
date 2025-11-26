# app/infrastructure/persistence/memory.py
from typing import Dict, Optional
from app.core.interfaces.repository import ISessionRepository
from app.domain.models.state import SessionState
from app.utils.logger import setup_logger

logger = setup_logger("MemoryRepo")

class MemorySessionRepository(ISessionRepository):
    """
    In-Memory implementation of the Session Repository.
    Non-persistent (data lost on restart), but thread-safe for async context.
    """
    def __init__(self):
        # The actual storage container
        self._storage: Dict[str, SessionState] = {}

    async def get(self, session_id: str) -> Optional[SessionState]:
        session = self._storage.get(session_id)
        if session:
            logger.debug(f"📖 Loaded session: {session_id}")
        else:
            logger.debug(f"⚠️ Session not found: {session_id}")
        return session

    async def save(self, state: SessionState) -> None:
        self._storage[state.session_id] = state
        logger.debug(f"💾 Saved session: {state.session_id} (Steps: {len(state.process_steps)})")

    async def delete(self, session_id: str) -> None:
        if session_id in self._storage:
            del self._storage[session_id]
            logger.info(f"🗑️ Deleted session: {session_id}")