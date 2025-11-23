from src.config.triggers import IntentTriggers

class IntentClassifier:
    """
    Responsible for classifying User Intent.
    Currently uses Config-based matching.
    TODO: Replace 'classify' body with an OpenAI Router Call.
    """
    
    @staticmethod
    def classify(user_input: str, language: str) -> str:
        text = user_input.lower()
        
        # Check against externalized configuration
        for trigger in IntentTriggers.get_triggers("GENERATE_ARTIFACTS", language):
            if trigger in text:
                return "GENERATE_ARTIFACTS"
                
        for trigger in IntentTriggers.get_triggers("RESET_CONTEXT", language):
            if trigger in text:
                return "RESET_CONTEXT"
                
        return "CONVERSATION"