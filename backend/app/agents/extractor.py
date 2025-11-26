from typing import List, Dict
from app.core.llm.interface import ILLMClient
from app.domain.models.state import ExtractionResult, SessionState

SYSTEM_PROMPT = """
You are an Expert Business Analyst Observer. 
Your task is to listen to the conversation and EXTRACT structured business requirements.
Do NOT invent information. Only extract what is explicitly stated or strongly implied.
If a field is not mentioned, leave it empty/null.

Focus on:
1. Actors (Who is involved?)
2. Business Goals (Why are we doing this?)
3. Process Steps (What happens?)
4. Scope (What is the boundary?)
"""

class ExtractorAgent:
    def __init__(self, llm_client: ILLMClient):
        self.llm = llm_client

    async def analyze(self, history: List[Dict[str, str]]) -> ExtractionResult:
        """
        Analyzes chat history and extracts specific entities.
        """
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            # Context window optimization: Only send last 10 messages if needed
            *history[-10:] 
        ]

        # Call the LLM with the Strict Schema
        result = await self.llm.get_structured_completion(
            messages=messages,
            response_model=ExtractionResult,
        )
        return result