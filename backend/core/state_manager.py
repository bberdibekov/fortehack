# src\core\state_manager.py
import streamlit as st
import pandas as pd
import time
import uuid
from src.config import AppConfig
from src.ui.templates import TextTemplates
from src.core.domain.models import AnalystNotebook, SessionData
from src.core.persistence.file_repo import FileSessionRepository

class StateManager:
    """
    Manages Session State and Persistence.
    """
    
    def __init__(self):
        self.repo = FileSessionRepository()
        self._init_state()

    def _init_state(self):
        # 1. Initialize Core State Keys if missing
        if "language" not in st.session_state:
            st.session_state.language = "en"

        if "messages" not in st.session_state:
            self._reset_messages()
        
        if "diagram_code" not in st.session_state:
            st.session_state.diagram_code = AppConfig.DEFAULT_DIAGRAM

        if "data_specs" not in st.session_state:
            st.session_state.data_specs = pd.DataFrame(
                [{"Field": "Customer_ID", "Type": "UUID", "Source": "CRM", "Validation": "Not Null"}]
            )
        
        if "layout_split" not in st.session_state:
            st.session_state.layout_split = 0.5

        if "notebook" not in st.session_state:
            st.session_state.notebook = AnalystNotebook()
            
        # --- NEW: Session Management Keys ---
        if "current_session_id" not in st.session_state:
            st.session_state.current_session_id = None
            
        if "session_name" not in st.session_state:
            st.session_state.session_name = "New Analysis"

    def _reset_messages(self):
        greeting = TextTemplates.get(st.session_state.language, "initial_greeting")
        st.session_state.messages = [{"role": "assistant", "content": greeting}]

    # --- PERSISTENCE OPERATIONS ---

    def save_current_session(self):
        """
        Pack current state into SessionData and save to disk.
        """
        # If no ID, generate one
        if not st.session_state.current_session_id:
            st.session_state.current_session_id = str(uuid.uuid4())

        # Construct Aggregate
        session_data = SessionData(
            session_id=st.session_state.current_session_id,
            name=st.session_state.session_name,
            last_updated=time.time(),
            language=self.language,
            notebook=self.notebook,
            messages=self.messages,
            diagram_code=self.diagram_code
        )
        
        # Save
        self.repo.save_session(session_data)
        
    def load_session(self, session_id: str):
        """
        Load data from disk and hydrate st.session_state
        """
        data = self.repo.load_session(session_id)
        if data:
            st.session_state.current_session_id = data.session_id
            st.session_state.session_name = data.name
            st.session_state.language = data.language
            st.session_state.notebook = data.notebook
            st.session_state.messages = data.messages
            st.session_state.diagram_code = data.diagram_code
            return True
        return False
        
    def create_new_session(self):
        """Resets the state for a fresh start"""
        st.session_state.current_session_id = str(uuid.uuid4())
        st.session_state.session_name = f"Analysis {time.strftime('%H:%M')}"
        st.session_state.notebook = AnalystNotebook()
        st.session_state.diagram_code = AppConfig.DEFAULT_DIAGRAM
        self._reset_messages()
        # Immediately save empty state so it appears in list
        self.save_current_session()

    def list_available_sessions(self):
        return self.repo.list_sessions()

    # --- PROPERTIES (Proxies) ---
    
    @property
    def language(self): return st.session_state.language
    @language.setter
    def language(self, val): st.session_state.language = val

    @property
    def messages(self): return st.session_state.messages
    
    def add_user_message(self, content):
        st.session_state.messages.append({"role": "user", "content": content})
    def add_assistant_message(self, content):
        st.session_state.messages.append({"role": "assistant", "content": content})

    @property
    def diagram_code(self): return st.session_state.diagram_code
    @diagram_code.setter
    def diagram_code(self, val): st.session_state.diagram_code = val

    @property
    def data_specs(self): return st.session_state.data_specs
    @data_specs.setter
    def data_specs(self, val): st.session_state.data_specs = val

    @property
    def notebook(self) -> AnalystNotebook:
        return st.session_state.notebook

    def update_notebook(self, new_notebook: AnalystNotebook):
        st.session_state.notebook = new_notebook