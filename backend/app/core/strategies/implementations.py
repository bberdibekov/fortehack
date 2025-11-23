# src/core/strategies/implementations.py
import re
from typing import List, Optional
from pydantic import BaseModel, Field

from src.config.settings import AppConfig
from src.core.strategies.interface import IActionStrategy
from src.core.domain.models import StrategyResult, AnalystNotebook
from src.core.llm.interface import ILLMClient
from src.core.llm.prompts import CHAT_SYSTEM_PROMPT, DIAGRAM_SYSTEM_PROMPT
from src.utils.logger import setup_logger

# Initialize Logger
logger = setup_logger("Strategies")

# --- 1. CONVERSATION STRATEGY (Chat) ---

class ConversationAction(IActionStrategy):
    """
    Handles standard Q&A using the "Fast" model.
    It uses the Notebook as context (RAG-lite) to answer questions intelligently.
    """
    def __init__(self, client: ILLMClient):
        self.client = client

    async def execute(self, user_input: str, language: str, notebook: AnalystNotebook) -> StrategyResult:
        logger.info(f"💬 Executing Conversation Strategy for input: '{user_input[:50]}...'")
        
        # 1. Prepare Prompt with Context
        # We dump the current state so the bot knows what has been discussed
        notebook_json = notebook.model_dump_json()
        system_msg = CHAT_SYSTEM_PROMPT.format(notebook_context=notebook_json)
        
        messages = [
            {"role": "system", "content": system_msg},
            {"role": "user", "content": user_input}
        ]
        
        # 2. Call LLM (Text Mode)
        # We use the FAST_MODEL (e.g., gpt-4o-mini) for low latency
        try:
            response_text = await self.client.get_text_completion(
                messages=messages,
                temperature=0.7, 
                model=AppConfig.LLM.FAST_MODEL 
            )
        except Exception as e:
            logger.error(f"Chat generation failed: {e}")
            response_text = "I apologize, but I'm having trouble connecting to my thought process right now."
        
        # 3. Return Result 
        # We pass the generated text as 'message_key'. The Processor will detect it's not a template key.
        return StrategyResult(
            message_key=response_text,
            diagram_code="", # Keep existing diagram (Processor won't overwrite if empty)
            data_rows=[],
            updated_notebook=None
        )


# --- 2. BLUEPRINT/GENERATION STRATEGY (Diagrams) ---

class DiagramResponse(BaseModel):
    """Structured output schema for the diagram generator"""
    mermaid_code: str = Field(..., description="The raw Mermaid.js code")
    explanation: str = Field(..., description="Brief summary of what was generated")

class BlueprintAction(IActionStrategy):
    """
    Generates artifacts (Diagrams) using the "Smart" model.
    Includes Gatekeeper logic and Output Sanitization.
    """
    def __init__(self, client: ILLMClient):
        self.client = client

    def _sanitize_mermaid(self, raw_code: str) -> str:
        """
        Cleans LLM artifacts.
        """
        clean_code = raw_code.strip()
        
        # 1. Remove Markdown Fences
        clean_code = re.sub(r"^```mermaid", "", clean_code, flags=re.MULTILINE)
        clean_code = re.sub(r"^```", "", clean_code, flags=re.MULTILINE)
        clean_code = re.sub(r"```$", "", clean_code, flags=re.MULTILINE)
        
        # 2. Fix specific syntax issues known to break Mermaid 10.x
        # Replace semicolons in labels with commas (Common LLM mistake)
        # We do this gently to not break the ; at end of line (though Mermaid doesn't strictly need them)
        clean_code = clean_code.replace(";", "") 
        
        return clean_code.strip()

    async def execute(self, user_input: str, language: str, notebook: AnalystNotebook) -> StrategyResult:
        logger.info("🎨 Executing Blueprint Strategy (Diagram Generation)")

        # --- Gatekeeper Logic ---
        # Don't waste tokens generating a diagram if we don't know the basic Goal or Actors.
        if not notebook.goal:
            logger.info("⛔ Gatekeeper Blocked: Missing Goal")
            return StrategyResult(
                message_key="ask_goal", # UI Template Key
                diagram_code="", data_rows=[], updated_notebook=None
            )
        if not notebook.actors:
            logger.info("⛔ Gatekeeper Blocked: Missing Actors")
            return StrategyResult(
                message_key="ask_actors", # UI Template Key
                diagram_code="", data_rows=[], updated_notebook=None
            )

        # --- Generation Logic ---
        
        # 1. Prepare Messages
        messages = [
            {"role": "system", "content": DIAGRAM_SYSTEM_PROMPT},
            {"role": "user", "content": f"Generate a flow for this process:\n{notebook.model_dump_json()}"}
        ]
        
        try:
            # 2. Call LLM (Structured Mode)
            # Use SMART_MODEL (e.g., gpt-4o or o1) for complex logic.
            # Pass temperature=None to avoid 400 Errors with o1 models.
            structured_resp = await self.client.get_structured_completion(
                messages=messages,
                response_model=DiagramResponse,
                temperature=None, 
                model=AppConfig.LLM.SMART_MODEL
            )
            
            # 3. Sanitize Output
            diagram_code = self._sanitize_mermaid(structured_resp.mermaid_code)
            response_text = structured_resp.explanation
            
            logger.info(f"✅ Diagram Generated ({len(diagram_code)} chars)")
            
        except Exception as e:
            logger.error(f"❌ Diagram Generation Failed: {e}")
            # Fallback diagram to prevent UI crash
            diagram_code = "graph TD;\nError[Generation Error] --> End;"
            # We add a click event style to the error node so it looks intentional
            diagram_code += "\nstyle Error fill:#ffcccc,stroke:#ff0000"
            response_text = f"I encountered an error generating the diagram: {str(e)[:50]}..."

        # 4. Return Result
        return StrategyResult(
            message_key=response_text,
            diagram_code=diagram_code,
            data_rows=[], # Data Spec generation is not yet implemented in this strategy
            updated_notebook=None # We don't modify the notebook here, only visualize it
        )


class ResetAction(IActionStrategy):
    """
    Clears the current context.
    """
    async def execute(self, user_input: str, language: str, notebook: AnalystNotebook) -> StrategyResult:
        logger.info("🧹 Executing Reset Strategy")
        
        # Return an empty notebook to signal a state wipe
        empty_notebook = AnalystNotebook()
        
        return StrategyResult(
            message_key="resp_reset",
            diagram_code="graph TD; Start-->End;",
            data_rows=[],
            updated_notebook=empty_notebook
        )