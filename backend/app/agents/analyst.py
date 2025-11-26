# app/agents/analyst.py
from app.core.llm.interface import ILLMClient
from app.domain.models.state import SessionState
from app.domain.models.artifacts import StoryArtifact
from app.core.services.context import system_context 

PROMPT_TEMPLATE = """
You are an Agile Business Analyst.
Generate a list of User Stories based on the provided Context.

{context_block}

RULES:
1. Follow standard format: "As a <role>, I want to <action>, so that <benefit>".
2. PRIMARILY derive stories from the 'PROCESS FLOW' steps.
3. Ensure every 'DEFINED ACTOR' has at least one story (even if high-level).
4. Include 3-5 acceptance criteria per story.
"""

class AnalystAgent:
    def __init__(self, llm_client: ILLMClient):
        self.llm = llm_client

    async def generate_stories(self, state: SessionState) -> StoryArtifact:
        # 1. Build Dynamic Context (The same source of truth used by Mermaid)
        context_str = system_context.build(state)

        messages = [
            {"role": "system", "content": PROMPT_TEMPLATE.format(
                context_block=context_str
            )}
        ]

        # 2. Call LLM
        result = await self.llm.get_structured_completion(
            messages=messages,
            response_model=StoryArtifact,
        )
        
        return result