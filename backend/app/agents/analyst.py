from app.core.llm.interface import ILLMClient
from app.domain.models.state import SessionState
from app.domain.models.artifacts import StoryArtifact

PROMPT_TEMPLATE = """
You are an Agile Business Analyst.
Generate a list of User Stories based on the following requirements.

Business Goal: {goal}
Actors: {actors}

RULES:
1. Follow standard format: "As a <role>, I want to <action>, so that <benefit>".
2. Include 3-5 acceptance criteria per story.
"""

class AnalystAgent:
    def __init__(self, llm_client: ILLMClient):
        self.llm = llm_client

    async def generate_stories(self, state: SessionState) -> StoryArtifact:
        if not state.goal and not state.actors:
            # Fallback if state is empty
            return StoryArtifact(stories=[])

        messages = [
            {"role": "system", "content": PROMPT_TEMPLATE.format(
                goal=state.goal.main_goal if state.goal else "Undefined",
                actors=str([a.role_name for a in state.actors])
            )}
        ]

        result = await self.llm.get_structured_completion(
            messages=messages,
            response_model=StoryArtifact,
        )
        
        return result