# app/agents/mermaid.py
from app.core.llm.interface import ILLMClient
from app.domain.models.state import SessionState
from app.domain.models.artifacts import MermaidArtifact
from app.core.services.context import system_context
from app.agents.prompts.mermaid import MERMAID_PROMPT_TEMPLATE

class MermaidAgent:
    def __init__(self, llm_client: ILLMClient):
        self.llm = llm_client

    async def generate(self, state: SessionState) -> MermaidArtifact:
        # 1. Build Dynamic Context
        context_str = system_context.build(state)

        messages = [
            {"role": "system", "content": MERMAID_PROMPT_TEMPLATE.format(
                context_block=context_str
            )}
        ]

        # 2. Call LLM
        result = await self.llm.get_structured_completion(
            messages=messages,
            response_model=MermaidArtifact,
        )
        
        return result