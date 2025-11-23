# src/config/settings.py
import streamlit as st
import os
from dotenv import load_dotenv

load_dotenv()

class AgentConfig:
    """
    Centralized configuration for Agent Models.
    """
    SMART_MODEL = os.getenv("OPENAI_SMART_MODEL", "gpt-5")
    FAST_MODEL = os.getenv("OPENAI_FAST_MODEL", "gpt-5-mini")

class AppConfig:
    APP_NAME = "AI Business Analyst Agent"
    PAGE_ICON = "🤖"
    LAYOUT = "wide"
    DEFAULT_DIAGRAM = """
    graph TD
        Start[Start] --> Input[Wait for User Input]
        style Input fill:#f9f,stroke:#333
    """
    
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    SESSIONS_DIR = os.path.join(BASE_DIR, "data", "sessions")
    
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    
    # Expose Agent Config
    LLM = AgentConfig

    @staticmethod
    def init_page():
        st.set_page_config(
            page_title=AppConfig.APP_NAME,
            page_icon=AppConfig.PAGE_ICON,
            layout=AppConfig.LAYOUT,
            initial_sidebar_state="expanded"
        )
        os.makedirs(AppConfig.SESSIONS_DIR, exist_ok=True)
        if not AppConfig.OPENAI_API_KEY:
             st.sidebar.error("⚠️ OPENAI_API_KEY missing")