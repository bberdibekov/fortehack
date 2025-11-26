# app/core/orchestrator.py
import asyncio
import json
import traceback
from typing import Callable, Dict, Any, Awaitable

from app.config.settings import AgentConfig
from app.core.llm.interface import ILLMClient
from app.core.llm.openai_client import OpenAIClient
from app.core.llm.groq_client import GroqClient
from app.core.llm.types import LLMResponse, ToolCallRequest

from app.core.services.state_manager import StateManager
from app.core.services.requirements import RequirementsService
from app.core.gap_engine import GapEngine
from app.agents.checker import CheckerAgent
from app.agents.mermaid import MermaidAgent
from app.agents.analyst import AnalystAgent
from app.core.services.mapper import DomainMapper
from app.domain.models.state import SessionState

# Persistence & RAG
from app.core.interfaces.repository import ISessionRepository
from app.infrastructure.knowledge.local_store import LocalPolicyStore

# Tooling
from app.core.tools.base import ToolContext
from app.core.tools.registry import ToolRegistry
from app.core.tools.definitions import UpdateRequirementsTool, TriggerVisualizationTool

# Prompts
from app.core.llm.prompts.system_manager import SYSTEM_MANAGER_PROMPT


class Orchestrator:
    def __init__(self, session_id: str, emit: Callable, repository: ISessionRepository):
        self.session_id = session_id
        self.emit = emit # Raw emitter
        
        # 1. Infrastructure
        self.openai_client: ILLMClient = OpenAIClient()
        self.groq_client: ILLMClient = GroqClient()
        self.policy_store = LocalPolicyStore()
        
        # 2. Domain Services
        self.state_manager = StateManager(repository)
        self.gap_engine = GapEngine()
        self.checker_agent = CheckerAgent(self.groq_client, self.policy_store)
        self.requirements_service = RequirementsService(
            self.state_manager,
            self.gap_engine,
            self.checker_agent
        )

        # 3. Artifact Agents
        self.mermaid_agent = MermaidAgent(self.groq_client)
        self.analyst_agent = AnalystAgent(self.groq_client)

        # --- STRATEGY PATTERN REGISTRY ---
        # Maps artifact_type string -> Async Function that takes State and returns a Pydantic Model
        self.artifact_generators: Dict[str, Callable[[SessionState], Awaitable[Any]]] = {
            "mermaid_diagram": self.mermaid_agent.generate,
            "user_story": self.analyst_agent.generate_stories,
        }

        self.tasks: Dict[str, asyncio.Task] = {}

        # 4. Tool Registry
        self.services = {
            "requirements_service": self.requirements_service,
            "scheduler": self._schedule_artifact_task
        }
        self.registry = ToolRegistry()
        self.registry.register(UpdateRequirementsTool())
        self.registry.register(TriggerVisualizationTool())

    async def emit_mapped(self, message_dict: Dict[str, Any]):
        """Helper to emit strictly typed messages from Mapper."""
        await self.emit(message_dict["type"], message_dict["payload"])

    async def handle_user_message(self, message: str):
        state = await self.state_manager.get_or_create_session(self.session_id)
        state.chat_history.append({"role": "user", "content": message})
        await self.state_manager.save_session(state)
        
        # Notify UI that we are working
        await self.emit_mapped(DomainMapper.to_status_update("thinking", "Processing..."))
        
        tool_context = ToolContext(state, self.emit, self.services) # Pass raw emit to tools
        
        messages = [{"role": "system", "content": SYSTEM_MANAGER_PROMPT}] + state.chat_history
        tools_schema = self.registry.get_schemas()
        max_turns = AgentConfig.MAX_AGENT_TURNS

        try:
            for i in range(max_turns):
                status_msg = "Processing..." if i == 0 else "Reviewing results..."
                await self.emit_mapped(DomainMapper.to_status_update("thinking", status_msg))

                response: LLMResponse = await self.openai_client.chat_with_tools(
                    messages=messages,
                    tools_schema=tools_schema,
                )
                
                if response.tool_calls:
                    # Update UI status
                    await self.emit_mapped(DomainMapper.to_status_update("working", "Using tools..."))
                    
                    assistant_msg = {
                        "role": "assistant",
                        "content": response.content, 
                        "tool_calls": [
                            {
                                "id": tc.call_id,
                                "type": "function",
                                "function": {
                                    "name": tc.function_name,
                                    "arguments": tc.arguments
                                }
                            } for tc in response.tool_calls
                        ]
                    }
                    messages.append(assistant_msg)
                    state.chat_history.append(assistant_msg)
                    await self.state_manager.save_session(state)

                    for tool_call in response.tool_calls:
                        tool_name = tool_call.function_name
                        tool = self.registry.get_tool(tool_name)
                        tool_output_str = ""

                        if tool:
                            try:
                                args = json.loads(tool_call.arguments)
                                # Tools handle their own Mapper logic for Side Effects
                                tool_output_str = await tool.execute(args, tool_context)
                            except Exception as e:
                                tool_output_str = json.dumps({"error": f"Tool execution failed: {str(e)}"})
                        else:
                            tool_output_str = json.dumps({"error": f"Unknown tool: {tool_name}"})

                        tool_msg = {
                            "role": "tool",
                            "tool_call_id": tool_call.call_id,
                            "content": tool_output_str
                        }
                        messages.append(tool_msg)
                        state.chat_history.append(tool_msg)
                    
                    await self.state_manager.save_session(state)
                    continue
                
                if response.content:
                    state.chat_history.append({"role": "assistant", "content": response.content})
                    await self.state_manager.save_session(state)
                    
                    # STRICT MAPPING: Chat Delta
                    await self.emit_mapped(DomainMapper.to_chat_delta(response.content))
                    
                    # Reset Status
                    await self.emit_mapped(DomainMapper.to_status_update("idle", "Ready"))
                    break 
            
        except Exception as e:
            print(f"💀 Orchestrator Error: {e}")
            await self.emit_mapped(DomainMapper.to_status_update("idle", "Error processing request"))
            await self.emit_mapped(DomainMapper.to_chat_delta("I encountered an internal error."))

    def _schedule_artifact_task(self, artifact_type: str):
        if artifact_type in self.tasks:
            task = self.tasks[artifact_type]
            if not task.done():
                task.cancel()
        
        new_task = asyncio.create_task(self._run_artifact_generator(artifact_type))
        self.tasks[artifact_type] = new_task
        
        def _cleanup(t):
            if self.tasks.get(artifact_type) == t:
                del self.tasks[artifact_type]
        new_task.add_done_callback(_cleanup)

    async def _run_artifact_generator(self, artifact_type: str):
        # STRICT MAPPING: Status Update
        await self.emit_mapped(DomainMapper.to_status_update("working", f"Generating {artifact_type}..."))
        
        try:
            generator_func = self.artifact_generators.get(artifact_type)
            if not generator_func:
                print(f"⚠️ No generator registered for: {artifact_type}")
                return

            state = await self.state_manager.get_or_create_session(self.session_id)
            
            result_model = await generator_func(state)
            new_content = result_model.model_dump()
            
            if new_content:
                # 3. Persistence & Versioning (INTERNAL)
                # We keep this for our own safety/undo history
                current_version = state.artifact_counters.get(artifact_type, 0)
                new_version = current_version + 1
                state.artifact_counters[artifact_type] = new_version
                
                internal_id = f"{artifact_type}-v{new_version}"
                state.artifacts[internal_id] = new_content
                await self.state_manager.save_session(state)
                
                # 4. Emission (EXTERNAL)
                try:
                    # STABLE ID for Frontend (forces rewrite of same tab)
                    wire_id = artifact_type 
                    
                    # A. Force Update (Rewrites content if tab exists)
                    update_payload = DomainMapper.to_artifact_update(
                        artifact_type, 
                        new_content, 
                        doc_id=wire_id
                    )
                    await self.emit_mapped(update_payload)

                    # B. Ensure Open (Opens tab if closed, or focuses if open)
                    open_payload = DomainMapper.to_artifact_open(
                        artifact_type, 
                        new_content, 
                        doc_id=wire_id
                    )
                    await self.emit_mapped(open_payload)

                    await self.emit_mapped(DomainMapper.to_status_update("success", f"Generated {artifact_type}"))
                    print(f"✅ Generator FINISHED: {internal_id} -> Wire: {wire_id}")
                    
                except Exception as map_err:
                    print(f"🔥 MAPPING ERROR for {artifact_type}: {map_err}")
                    traceback.print_exc()
                    raise map_err 
                
        except asyncio.CancelledError:
            print(f"🛑 Generator Cancelled: {artifact_type}")
        except Exception as e:
            print(f"❌ Generator Failed: {e}")
            await self.emit_mapped(DomainMapper.to_status_update("idle", f"Failed to generate {artifact_type}"))
            traceback.print_exc()
        finally:
            await self.emit_mapped(DomainMapper.to_status_update("idle", "Ready"))