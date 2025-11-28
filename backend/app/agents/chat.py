from typing import List, Dict
from app.core.llm.interface import ILLMClient
from app.domain.models.state import SessionState

PROMPT_TEMPLATE = """
You are a Senior Business Analyst. Your goal is to gather requirements for a project or process.

CONTEXT:
Current Knowledge State: {state_summary}
Missing Information: {missing_info}
Analyst Advice: {advice}

INSTRUCTIONS:
1. Read the chat history.
2. If the user just provided the missing info, acknowledge it briefly.
3. Use the "Analyst Advice" to formulate your next question.
4. Be conversational, not robotic. Do NOT output a numbered list of questions. Ask ONE thing at a time.
5. If the user asks a question, answer it.
6. Format your responses in MD style.

Current User Input: {last_user_input}
"""

class ChatAgent:
    def __init__(self, llm_client: ILLMClient):
        self.llm = llm_client

    async def respond(self, state: SessionState, advice: str, missing: List[str]) -> str:
        # Summarize state for context (keep it brief)
        state_summary = f"""
        Scope: {state.project_scope or 'Unknown'}
        Actors: {len(state.actors)} found
        Goal: {'Defined' if state.goal else 'Unknown'}
        Steps: {len(state.process_steps)} found
        """
        
        # Get last user message
        last_input = state.chat_history[-1]['content'] if state.chat_history else ""

        messages = [
            {"role": "system", "content": PROMPT_TEMPLATE.format(
                state_summary=state_summary,
                missing_info=str(missing),
                advice=advice,
                last_user_input=last_input
            )},
            # Append recent history for flow context
            *state.chat_history[-5:] 
        ]

        # Generate text response
        response = await self.llm.get_text_completion(
            messages=messages,
        )
        
        return response