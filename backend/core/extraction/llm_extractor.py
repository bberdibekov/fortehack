# src/core/extraction/llm_extractor.py
import json
from src.core.extraction.interface import IRequirementExtractor
from src.core.domain.models import AnalystNotebook
from src.core.llm.interface import ILLMClient
from src.core.llm.prompts import EXTRACTOR_SYSTEM_PROMPT
from src.core.utils import run_async
from src.config.settings import AppConfig

class LLMRequirementExtractor(IRequirementExtractor):
    """
    Real implementation using an LLM to parse natural language 
    into the AnalystNotebook structure.
    """
    
    def __init__(self, client: ILLMClient):
        self.client = client

    def extract(self, current_state: AnalystNotebook, user_input: str) -> AnalystNotebook:
        """
        Synchronous entry point that bridges to the Async LLM client.
        """
        return run_async(self._extract_async(current_state, user_input))

    async def _extract_async(self, current_state: AnalystNotebook, user_input: str) -> AnalystNotebook:
        current_state_json = current_state.model_dump_json()
        messages = [
            {"role": "system", "content": EXTRACTOR_SYSTEM_PROMPT},
            {"role": "user", "content": f"--- CURRENT NOTEBOOK STATE ---\n{current_state_json}"},
            {"role": "user", "content": f"--- NEW INPUT ---\n{user_input}"}
        ]

        try:
            return await self.client.get_structured_completion(
                messages=messages,
                response_model=AnalystNotebook,
                # Pass None to use the model's default behavior (Fixes 400 Error for o1)
                temperature=None, 
                model=AppConfig.LLM.SMART_MODEL
            )
        except Exception as e:
            print(f"[Extractor Error] {e}")
            return current_state