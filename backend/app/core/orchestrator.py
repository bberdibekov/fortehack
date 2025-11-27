# app/core/orchestrator.py
import asyncio
import json
import traceback
from typing import Callable, Dict, Any, Awaitable, List

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
from app.agents.workbook import WorkbookAgent # <--- NEW IMPORT

from app.core.services.mapper import DomainMapper
from app.domain.models.state import SessionState

# Persistence & RAG
from app.core.interfaces.repository import ISessionRepository
from app.infrastructure.knowledge.local_store import LocalPolicyStore

# Tooling
from app.core.tools.base import ToolContext
from app.core.tools.registry import ToolRegistry
from app.core.tools.definitions import UpdateRequirementsTool, TriggerVisualizationTool

# Validation & Context
from app.core.services.validator import ConsistencyValidator
from app.domain.models.validation import ComplianceIssue

from app.core.services.edit_strategies import EditStrategyFactory

# Prompts
from app.core.llm.prompts.system_manager import SYSTEM_MANAGER_PROMPT

# Logging
from app.utils.logger import setup_logger

logger = setup_logger("Orchestrator")

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
        self.workbook_agent = WorkbookAgent(self.groq_client)

        # Maps artifact_type -> Async Generator Function
        self.artifact_generators: Dict[str, Callable[[SessionState], Awaitable[Any]]] = {
            "mermaid_diagram": self.mermaid_agent.generate,
            "user_story": self.analyst_agent.generate_stories,
            "workbook": self.workbook_agent.generate,
        }

        # Maps artifact_type -> Sync Validator Function
        # Signature: (content_dict, state) -> List[ComplianceIssue]
        self.artifact_validators: Dict[str, Callable[[Dict, SessionState], List[ComplianceIssue]]] = {
            "mermaid_diagram": ConsistencyValidator.validate_mermaid,
            "user_story": ConsistencyValidator.validate_stories
            # "workbook": ConsistencyValidator.validate_workbook (Optional: Add later if needed)
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
        # 1. Load State (Ensures we act on persisted data)
        state = await self.state_manager.get_or_create_session(self.session_id)
        
        # 2. Append User Message
        state.chat_history.append({"role": "user", "content": message})
        await self.state_manager.save_session(state)
        
        # Notify UI that we are working
        await self.emit_mapped(DomainMapper.to_status_update("thinking", "Processing..."))
        
        tool_context = ToolContext(state, self.emit, self.services)
        
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
                                logger.info(f"🛠️ Tool Execution: {tool_name}")
                                # Tools handle their own Mapper logic for Side Effects
                                tool_output_str = await tool.execute(args, tool_context)
                            except Exception as e:
                                error_msg = f"Tool execution failed: {str(e)}"
                                logger.error(f"❌ {error_msg}")
                                tool_output_str = json.dumps({"error": error_msg})
                        else:
                            error_msg = f"Unknown tool: {tool_name}"
                            logger.error(f"❌ {error_msg}")
                            tool_output_str = json.dumps({"error": error_msg})

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
            logger.error(f"💀 Orchestrator Error: {e}")
            traceback.print_exc()
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

    async def handle_artifact_edit(self, doc_id: str, new_content: Any):
        """
        Handles manual user edits to an artifact.
        """
        # 1. Acknowledge Receipt (Processing)
        await self.emit_mapped(DomainMapper.to_artifact_sync(doc_id, "processing", "Validating..."))
        
        try:
            state = await self.state_manager.get_or_create_session(self.session_id)

            # 2. Identify the Internal Target
            # The frontend sends 'mermaid_diagram'. We need to find the LATEST version of that.
            # We assume 'doc_id' maps directly to 'artifact_type' in our current mapping logic.
            artifact_type = doc_id 
            current_version = state.artifact_counters.get(artifact_type, 0)
            
            if current_version == 0:
                # Edge case: User edits something that doesn't exist yet?
                # We initialize it as v1
                current_version = 1
                state.artifact_counters[artifact_type] = 1

            internal_id = f"{artifact_type}-v{current_version}"

            # 3. Validate & Parse (Strategy Pattern)
            strategy = EditStrategyFactory.get_strategy(artifact_type)
            parsed_content = strategy.validate_and_parse(new_content)

            # 4. Save to State (Current State Logic)
            state.artifacts[internal_id] = parsed_content
            
            await self.state_manager.save_session(state)

            # 5. Success Response
            await self.emit_mapped(DomainMapper.to_artifact_sync(doc_id, "synced", "Saved"))
            logger.info(f"✏️  User Edited {internal_id}")

        except ValueError as ve:
            # Logic Error (Validation)
            logger.warning(f"⚠️ Edit Validation Failed: {ve}")
            await self.emit_mapped(DomainMapper.to_artifact_sync(doc_id, "error", str(ve)))
            
        except Exception as e:
            # System Error
            logger.error(f"🔥 Edit Handler Failed: {e}")
            traceback.print_exc()
            await self.emit_mapped(DomainMapper.to_artifact_sync(doc_id, "error", "Internal Server Error"))
    
    async def _run_artifact_generator(self, artifact_type: str):
        # STRICT MAPPING: Status Update
        await self.emit_mapped(DomainMapper.to_status_update("working", f"Generating {artifact_type}..."))
        
        try:
            generator_func = self.artifact_generators.get(artifact_type)
            if not generator_func:
                logger.warning(f"⚠️ No generator registered for: {artifact_type}")
                return

            state = await self.state_manager.get_or_create_session(self.session_id)
            
            # 1. EXECUTION
            result_model = await generator_func(state)
            new_content = result_model.model_dump()
            
            # 2. DYNAMIC VALIDATION (The "Reviewer")
            validator_func = self.artifact_validators.get(artifact_type)
            if validator_func and new_content:
                issues = validator_func(new_content, state)
                if issues:
                    # Emit warnings so user knows context was ignored
                    warn_payload = DomainMapper.to_validation_warn(issues, score=90)
                    await self.emit_mapped(warn_payload)
            
            # 3. Persistence & Versioning Phase
            if new_content:
                current_version = state.artifact_counters.get(artifact_type, 0)
                new_version = current_version + 1
                state.artifact_counters[artifact_type] = new_version
                
                internal_id = f"{artifact_type}-v{new_version}"
                state.artifacts[internal_id] = new_content
                await self.state_manager.save_session(state)
                
                # 4. Emission (EXTERNAL)
                try:
                    wire_id = artifact_type 
                    
                    update_payload = DomainMapper.to_artifact_update(
                        artifact_type, 
                        new_content, 
                        doc_id=wire_id
                    )
                    await self.emit_mapped(update_payload)

                    open_payload = DomainMapper.to_artifact_open(
                        artifact_type, 
                        new_content, 
                        doc_id=wire_id
                    )
                    await self.emit_mapped(open_payload)

                    await self.emit_mapped(DomainMapper.to_status_update("success", f"Generated {artifact_type}"))
                    logger.info(f"✅ Generator FINISHED: {internal_id} -> Wire: {wire_id}")
                    
                except Exception as map_err:
                    logger.error(f"🔥 MAPPING ERROR for {artifact_type}: {map_err}")
                    traceback.print_exc()
                    raise map_err 
                
        except asyncio.CancelledError:
            logger.info(f"🛑 Generator Cancelled: {artifact_type}")
        except Exception as e:
            logger.error(f"❌ Generator Failed: {e}")
            await self.emit_mapped(DomainMapper.to_status_update("idle", f"Failed to generate {artifact_type}"))
            traceback.print_exc()
        finally:
            await self.emit_mapped(DomainMapper.to_status_update("idle", "Ready"))

    async def load_initial_state(self, is_new_session: bool = False):
        """
        Called on WebSocket connection. 
        Restores the frontend to the last known backend state.
        """
        logger.info(f"🔄 [Orchestrator] Loading initial state for session: {self.session_id} (New={is_new_session})")
        
        try:
            # 1. EMIT SESSION IDENTITY (Must be first)
            await self.emit_mapped(DomainMapper.to_session_established(self.session_id, is_new_session))

            # 2. Get State
            state = await self.state_manager.get_or_create_session(self.session_id)
            logger.info(f"   - Found {len(state.chat_history)} raw messages in history.")
            logger.info(f"   - Found {len(state.artifacts)} stored artifacts.")
            
            # 3. Push Ledger State
            await self.emit_mapped(DomainMapper.to_state_update(state))
            
            # 4. Push Chat History
            # We wrap this in a specific try/catch to identify Mapping errors specifically
            try:
                history_msg = DomainMapper.to_chat_history(state.chat_history)
                await self.emit_mapped(history_msg)
                logger.info("   ✅ Emitted CHAT_HISTORY")
            except Exception as history_err:
                logger.error(f"   ❌ Failed to emit history: {history_err}")
                traceback.print_exc()
            
            # 5. Push Artifacts (Restore Tabs)
            # We iterate over current active versions
            for artifact_type, version in state.artifact_counters.items():
                internal_id = f"{artifact_type}-v{version}"
                content = state.artifacts.get(internal_id)
                
                if content:
                    logger.info(f"   - Restoring artifact: {internal_id}")
                    wire_id = artifact_type 
                    await self.emit_mapped(DomainMapper.to_artifact_open(
                        artifact_type, 
                        content, 
                        doc_id=wire_id
                    ))
            
            # 6. Signal Ready
            await self.emit_mapped(DomainMapper.to_status_update("idle", "Session Restored"))
            logger.info("   ✨ Session Restore Complete")

        except Exception as e:
            logger.error(f"🔥 Critical Error during load_initial_state: {e}")
            traceback.print_exc()