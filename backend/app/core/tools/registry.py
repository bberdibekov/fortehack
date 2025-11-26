from typing import Dict, List
from app.core.tools.base import BaseTool

class ToolRegistry:
    def __init__(self):
        self._tools: Dict[str, BaseTool] = {}

    def register(self, tool: BaseTool):
        self._tools[tool.name] = tool

    def get_tool(self, name: str) -> BaseTool:
        return self._tools.get(name)

    def get_schemas(self) -> List[Dict]:
        return [t.openai_schema for t in self._tools.values()]