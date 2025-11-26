# app/config/settings.py
import os
from dotenv import load_dotenv

load_dotenv()

class AgentConfig:
    """
    Centralized configuration for Agent Models.
    """
    SMART_MODEL = os.getenv("OPENAI_SMART_MODEL", "gpt-5-mini")
    FAST_MODEL = os.getenv("OPENAI_FAST_MODEL", "gpt-5-mini")
    SUPER_FAST_MODEL = 'gpt-5-nano'
    MAX_AGENT_TURNS: int = 5

class AppConfig:
    
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    SESSIONS_DIR = os.path.join(BASE_DIR, "data", "sessions")
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    LLM = AgentConfig