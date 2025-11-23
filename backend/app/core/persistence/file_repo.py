# src\core\persistence\file_repo.py
import json
import os
import glob
from typing import List, Optional
from src.core.persistence.interface import ISessionRepository
from src.core.domain.models import SessionData
from src.config.settings import AppConfig

class FileSessionRepository(ISessionRepository):
    """
    Persists sessions as JSON files in the data/sessions directory.
    """
    
    def __init__(self):
        self.directory = AppConfig.SESSIONS_DIR

    def _get_path(self, session_id: str) -> str:
        return os.path.join(self.directory, f"{session_id}.json")

    def save_session(self, session: SessionData) -> bool:
        try:
            path = self._get_path(session.session_id)
            # Pydantic's model_dump_json handles serialization automatically
            json_str = session.model_dump_json(indent=2)
            with open(path, "w", encoding="utf-8") as f:
                f.write(json_str)
            return True
        except Exception as e:
            print(f"[ERROR] Failed to save session: {e}")
            return False

    def load_session(self, session_id: str) -> Optional[SessionData]:
        path = self._get_path(session_id)
        if not os.path.exists(path):
            return None
            
        try:
            with open(path, "r", encoding="utf-8") as f:
                json_data = f.read()
            # Pydantic validation handles reconstruction
            return SessionData.model_validate_json(json_data)
        except Exception as e:
            print(f"[ERROR] Failed to load session {session_id}: {e}")
            return None

    def list_sessions(self) -> List[dict]:
        """
        Returns lightweight metadata for the UI selector.
        """
        files = glob.glob(os.path.join(self.directory, "*.json"))
        sessions = []
        
        for f_path in files:
            try:
                # Optimized: Read only the first few bytes/lines if file is huge, 
                # but for now we read full file to get 'name' safely.
                with open(f_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    sessions.append({
                        "id": data.get("session_id"),
                        "name": data.get("name", "Untitled"),
                        "last_updated": data.get("last_updated", 0)
                    })
            except Exception:
                continue
                
        # Sort by newest first
        return sorted(sessions, key=lambda x: x["last_updated"], reverse=True)

    def delete_session(self, session_id: str) -> bool:
        path = self._get_path(session_id)
        if os.path.exists(path):
            os.remove(path)
            return True
        return False