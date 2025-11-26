from dataclasses import dataclass, field
from typing import List, Optional, Any

@dataclass
class ToolCallRequest:
    call_id: str
    function_name: str
    arguments: str

@dataclass
class LLMResponse:
    content: Optional[str] = None
    tool_calls: List[ToolCallRequest] = field(default_factory=list)
    role: str = "assistant"
    raw_response: Any = None