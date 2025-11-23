# src/core/strategies/factory.py
from src.core.strategies.implementations import (
    ConversationAction, BlueprintAction, ResetAction
)
from src.core.strategies.interface import IActionStrategy
from src.core.llm.interface import ILLMClient

class ActionFactory:
    """
    Creates Strategy Instances.
    Now requires the LLM Client to inject into strategies.
    """
    
    def __init__(self, client: ILLMClient):
        self.client = client
        # Cache stateless strategies if desired, or create fresh
        self._strategies = {
            "CONVERSATION": ConversationAction(client),
            "GENERATE_ARTIFACTS": BlueprintAction(client),
            "RESET_CONTEXT": ResetAction()
        }
    
    def get_action(self, intent: str) -> IActionStrategy:
        return self._strategies.get(intent, self._strategies["CONVERSATION"])