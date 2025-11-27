from app.core.llm.interface import ILLMClient
from app.domain.models.state import SessionState
from app.domain.models.artifacts import WorkbookArtifact
from app.core.services.context import system_context

# We will define the prompt in app/agents/prompts/workbook.py
from app.agents.prompts.workbook import WORKBOOK_PROMPT

class WorkbookAgent:
    def __init__(self, llm_client: ILLMClient):
        self.llm = llm_client

    async def generate(self, state: SessionState) -> WorkbookArtifact:
        context_str = system_context.build(state)
        
        messages = [
            {"role": "system", "content": WORKBOOK_PROMPT.format(context_block=context_str)}
        ]

        # Structured Output is mandatory here
        result = await self.llm.get_structured_completion(
            messages=messages,
            response_model=WorkbookArtifact,
        )
        
        return result