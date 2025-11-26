from app.core.llm.interface import ILLMClient
from app.domain.models.state import SessionState
from app.domain.models.artifacts import MermaidArtifact

PROMPT_TEMPLATE = """
You are a Senior System Architect. 
Generate a MermaidJS SEQUENCE DIAGRAM based on the current business requirements.

CURRENT STATE:
Project Scope: {scope}
Actors: {actors}
Process Steps: {steps}

RULES:
1. Use 'sequenceDiagram' type.
2. Use safe node names (no spaces, use underscores).
3. If no steps are defined yet, create a placeholder diagram showing the Actors.
4. Return ONLY valid Mermaid syntax.
"""

class MermaidAgent:
    def __init__(self, llm_client: ILLMClient):
        self.llm = llm_client

    async def generate(self, state: SessionState) -> MermaidArtifact:
        # 1. Serialize State for the LLM
        # We only pass what matters to the diagram
        context_str = f"""
        Scope: {state.project_scope or "Undefined"}
        Actors: {', '.join([a.role_name for a in state.actors]) if state.actors else "None"}
        Steps: {state.process_steps}
        """

        messages = [
            {"role": "system", "content": PROMPT_TEMPLATE.format(
                scope=state.project_scope,
                actors=str([a.role_name for a in state.actors]),
                steps=str(state.process_steps)
            )}
        ]

        # 2. Call LLM
        result = await self.llm.get_structured_completion(
            messages=messages,
            response_model=MermaidArtifact,
        )
        
        return result