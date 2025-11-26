import asyncio
import json
from typing import Callable, Dict

from app.config.settings import AgentConfig
from app.core.llm.interface import ILLMClient
from app.core.llm.openai_client import OpenAIClient
from app.core.llm.groq_client import GroqClient
from app.core.llm.types import LLMResponse

from app.core.services.state_manager import StateManager
from app.core.gap_engine import GapEngine
from app.agents.checker import CheckerAgent
from app.agents.mermaid import MermaidAgent
from app.agents.analyst import AnalystAgent

# Tooling Infrastructure
from app.core.tools.base import ToolContext
from app.core.tools.registry import ToolRegistry
from app.core.tools.definitions import UpdateRequirementsTool, TriggerVisualizationTool

from app.core.interfaces.repository import ISessionRepository
from app.core.services.requirements import RequirementsService
from app.infrastructure.knowledge.local_store import LocalPolicyStore

# Prompts
from app.core.llm.prompts.system_manager import SYSTEM_MANAGER_PROMPT

class Orchestrator:
    def __init__(self, session_id: str, emit: Callable, repository: ISessionRepository):
        self.session_id = session_id
        self.emit = emit
        
        # 1. Core Infrastructure
        # In a generic setup, this client could be injected. 
        # For now, we default to OpenAIClient implementing ILLMClient.
        self.openai_client: ILLMClient = OpenAIClient()
        self.groq_client: ILLMClient = GroqClient()
        
        self.policy_store = LocalPolicyStore()
        self.state_manager = StateManager(repository)
        
        # 2. Domain Agents & Engines
        self.gap_engine = GapEngine()
        self.checker_agent = CheckerAgent(self.groq_client, self.policy_store)
        self.mermaid_agent = MermaidAgent(self.groq_client)
        self.analyst_agent = AnalystAgent(self.groq_client)

        self.requirements_service = RequirementsService(
            self.state_manager,
            self.gap_engine,
            self.checker_agent
        )

        # 3. Background Task Tracking (for Debouncing/Fire-and-Forget)
        self.tasks: Dict[str, asyncio.Task] = {}

        # 4. Service Container (Dependency Injection for Tools)
        # These services are injected into Tools so Tools remain stateless.
        self.services = {
            "requirements_service": self.requirements_service, # <--- NEW
            "scheduler": self._schedule_artifact_task
        }

        # 5. Tool Registry Setup
        self.registry = ToolRegistry()
        self.registry.register(UpdateRequirementsTool())
        self.registry.register(TriggerVisualizationTool())

    async def handle_user_message(self, message: str):
        """
        The Agentic 'ReAct' Loop using the Abstracted LLM Interface.
        """
        # 1. Load Fresh State & Persist User Message
        state = await self.state_manager.get_or_create_session(self.session_id)
        state.chat_history.append({"role": "user", "content": message})
        await self.state_manager.save_session(state)
        
        # 2. Prepare Context & Prompts
        tool_context = ToolContext(state, self.emit, self.services)
        
        # Construct message history (System + Chat)
        messages = [{"role": "system", "content": SYSTEM_MANAGER_PROMPT}] + state.chat_history
        tools_schema = self.registry.get_schemas()
        
        # 3. The Reasoning Loop
        # We loop to allow the model to call tools, see results, and call more tools if needed.
        max_turns = AgentConfig.MAX_AGENT_TURNS

        for _ in range(max_turns):
            try:
                # --- A. CALL ABSTRACTED LLM ---
                response: LLMResponse = await self.openai_client.chat_with_tools(
                    messages=messages,
                    tools_schema=tools_schema,
                )
                
                # --- B. Handle Tool Calls ---
                if response.tool_calls:
                    # 1. Reconstruct Assistant Message for History
                    # We must format this correctly for the Provider (e.g. OpenAI) to accept the follow-up.
                    assistant_msg = {
                        "role": "assistant",
                        "content": response.content, # Content might be null if purely calling tools
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
                    
                    # Append to ephemeral messages list (for the loop)
                    messages.append(assistant_msg)
                    # Append to persistent state history
                    state.chat_history.append(assistant_msg)
                    await self.state_manager.save_session(state)

                    # 2. Execute Tools
                    for tool_call in response.tool_calls:
                        tool_name = tool_call.function_name
                        tool = self.registry.get_tool(tool_name)
                        
                        print(f"🛠️ Executing: {tool_name}")
                        tool_output_str = ""

                        if tool:
                            try:
                                args = json.loads(tool_call.arguments)
                                # POLYMORPHIC EXECUTION
                                tool_output_str = await tool.execute(args, tool_context)
                            except json.JSONDecodeError:
                                tool_output_str = json.dumps({"error": "Invalid JSON arguments"})
                            except Exception as e:
                                tool_output_str = json.dumps({"error": f"Tool execution failed: {str(e)}"})
                        else:
                            tool_output_str = json.dumps({"error": f"Unknown tool: {tool_name}"})

                        # 3. Append Tool Result to History
                        tool_msg = {
                            "role": "tool",
                            "tool_call_id": tool_call.call_id,
                            "content": tool_output_str
                        }
                        messages.append(tool_msg)
                        state.chat_history.append(tool_msg)
                    
                    # Save state after tool executions
                    await self.state_manager.save_session(state)
                    
                    # CONTINUE LOOP -> The LLM will see the Tool Output in 'messages' and generate next response
                    continue
                
                # --- C. Handle Final Text Response ---
                if response.content:
                    # Update History
                    state.chat_history.append({"role": "assistant", "content": response.content})
                    await self.state_manager.save_session(state)
                    
                    # Send to User
                    await self.emit("CHAT_MESSAGE", response.content)
                    break # Loop finished
            
            except Exception as e:
                print(f"💀 Orchestrator Logic Failure: {e}")
                await self.emit("CHAT_MESSAGE", "I encountered an internal system error processing your request.")
                break

    # --- Background Scheduler Logic (Injected into Tools) ---

    def _schedule_artifact_task(self, artifact_type: str):
        """
        Manages background generation tasks.
        Uses Debouncing to cancel obsolete tasks.
        """
        # 1. Debounce
        if artifact_type in self.tasks:
            task = self.tasks[artifact_type]
            if not task.done():
                print(f"🛑 Debouncing: Cancelling old {artifact_type} generation")
                task.cancel()
        
        # 2. Fire & Forget
        new_task = asyncio.create_task(self._run_artifact_generator(artifact_type))
        self.tasks[artifact_type] = new_task
        
        # 3. Cleanup
        def _cleanup(t):
            if self.tasks.get(artifact_type) == t:
                del self.tasks[artifact_type]
        new_task.add_done_callback(_cleanup)

    async def _run_artifact_generator(self, artifact_type: str):
        """
        Worker logic for generating artifacts.
        """
        print(f"🔄 Generator Started: {artifact_type}")
        await self.emit("AGENT_STATUS", {"type": artifact_type, "status": "generating"})
        
        try:
            # Load fresh state from DB (Thread-safe)
            state = await self.state_manager.get_or_create_session(self.session_id)
            new_content = None
            
            # Route to Specific Agent
            if artifact_type == "mermaid_diagram":
                result = await self.mermaid_agent.generate(state)
                new_content = result.dict()
            elif artifact_type == "user_story":
                result = await self.analyst_agent.generate_stories(state)
                new_content = result.dict()
            # Add other agents (KPI, etc) here

            if new_content:
                # Update Artifact in State
                state.artifacts[artifact_type] = new_content
                await self.state_manager.save_session(state)
                
                # Notify UI
                await self.emit("ARTIFACT_UPDATE", {
                    "type": artifact_type, 
                    "content": new_content
                })
                print(f"✅ Generator Finished: {artifact_type}")
                
        except asyncio.CancelledError:
            print(f"🚫 Task Cancelled: {artifact_type}")
            # No emit needed, intentional cancel
        except Exception as e:
            print(f"❌ Generator Failed: {artifact_type} - {e}")
            await self.emit("AGENT_STATUS", {"type": artifact_type, "status": "error"})