# app/agents/mermaid.py
from app.core.llm.interface import ILLMClient
from app.domain.models.state import SessionState
from app.domain.models.artifacts import MermaidArtifact
from app.core.services.context import system_context # <--- Use the pipeline instance

PROMPT_TEMPLATE = """
You are a Senior System Architect. 
Generate a MermaidJS SEQUENCE DIAGRAM based on the provided Context.

{context_block}

RULES:
1. Use 'sequenceDiagram' type.
2. FIRST, declare ALL 'DEFINED ACTORS' using `participant Name` at the top of the file.
   - Do this even if they have no steps in the 'PROCESS FLOW' yet.
3. Then, map the 'PROCESS FLOW' to arrows (->>).
4. Use safe node names (no spaces, use underscores).
5. Return ONLY valid Mermaid syntax.
"""

class MermaidAgent:
    def __init__(self, llm_client: ILLMClient):
        self.llm = llm_client

    async def generate(self, state: SessionState) -> MermaidArtifact:
        # 1. Build Dynamic Context
        context_str = system_context.build(state)

        messages = [
            {"role": "system", "content": PROMPT_TEMPLATE.format(
                context_block=context_str
            )}
        ]

        # 2. Call LLM
        result = await self.llm.get_structured_completion(
            messages=messages,
            response_model=MermaidArtifact,
        )
        
        return result