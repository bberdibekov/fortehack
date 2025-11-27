# app/agents/analyst.py
import json
from app.core.llm.interface import ILLMClient
from app.domain.models.state import SessionState
from app.domain.models.artifacts import StoryArtifact
from app.core.services.context import system_context 

PROMPT_TEMPLATE = """
You are an Agile Business Analyst.
Generate or update the User Stories based on the provided Context and the Current Draft, if available.

{context_block}

=== CURRENT DRAFT (PREVIOUS VERSION) ===
{current_artifact_json}
========================================

INSTRUCTIONS:
1. **Preserve Manual Edits**: If a story in the CURRENT DRAFT matches a requirement, KEEP its 'priority', 'estimate', and 'acceptance_criteria' unless the new context explicitly contradicts it.
   - Example: If the draft says "Estimate: 10 SP" and the context doesn't mention time, KEEP "10 SP".
2. **Add Missing**: Generate new stories for any new Actors or Steps found in the Context that are missing from the Draft.
3. **Remove Obsolete**: Remove stories that no longer make sense given the current Context.
4. **Format**: Return the complete list of stories.
"""

class AnalystAgent:
    def __init__(self, llm_client: ILLMClient):
        self.llm = llm_client

    async def generate_stories(self, state: SessionState) -> StoryArtifact:
        # 1. Build Dynamic Context (The Ledger)
        context_str = system_context.build(state)

        # 2. Retrieve Latest Artifact (The Metadata Source)
        current_version = state.artifact_counters.get("user_story", 0)
        current_json = "No previous draft."
        
        if current_version > 0:
            internal_id = f"user_story-v{current_version}"
            raw_data = state.artifacts.get(internal_id)
            if raw_data:
                # Convert to compact JSON string for the prompt
                current_json = json.dumps(raw_data, indent=2)

        messages = [
            {"role": "system", "content": PROMPT_TEMPLATE.format(
                context_block=context_str,
                current_artifact_json=current_json
            )}
        ]

        # 3. Call LLM with Merge Instructions
        result = await self.llm.get_structured_completion(
            messages=messages,
            response_model=StoryArtifact,
        )
        
        return result