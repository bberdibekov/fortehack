# app/core/llm/exceptions.py

class LLMError(Exception):
    """Base class for LLM exceptions."""
    pass

class LLMRefusalError(LLMError):
    """Raised when the model refuses to generate the structured output (Safety)."""
    def __init__(self, refusal_message: str):
        self.refusal_message = refusal_message
        super().__init__(f"Model Refusal: {refusal_message}")

class LLMParsingError(LLMError):
    """Raised when the structure cannot be parsed (should be rare with strict=True)."""
    pass