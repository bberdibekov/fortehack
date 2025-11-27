# app/agents/use_case.py
import json
from app.core.llm.interface import ILLMClient
from app.domain.models.state import SessionState
from app.domain.models.artifacts import UseCaseArtifact
from app.core.services.context import system_context
from app.agents.prompts.use_case import USE_CASE_PROMPT

class UseCaseAgent:
    def __init__(self, llm_client: ILLMClient):
        self.llm = llm_client

    async def generate(self, state: SessionState) -> UseCaseArtifact:
        # 1. Context
        context_str = system_context.build(state)

        # 2. Retrieve Previous Draft (Forward Sync)
        current_version = state.artifact_counters.get("use_case", 0)
        current_json = "No previous draft."
        
        if current_version > 0:
            internal_id = f"use_case-v{current_version}"
            raw_data = state.artifacts.get(internal_id)
            if raw_data:
                current_json = json.dumps(raw_data, indent=2)
        
        messages = [
            {"role": "system", "content": USE_CASE_PROMPT.format(
                context_block=context_str,
                current_artifact_json=current_json
            )}
        ]

        result = await self.llm.get_structured_completion(
            messages=messages,
            response_model=UseCaseArtifact,
        )
        
        return result