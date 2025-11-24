import asyncio
from typing import Callable, Any
from app.domain.models.state import SessionState, Artifact
from app.core.config import DEPENDENCY_GRAPH

class Orchestrator:
    def __init__(self, session_id: str, emit: Callable):
        self.state = SessionState(session_id=session_id)
        self.emit = emit  # The function to push to WebSocket
        self.tasks = {}   # Track running tasks for cancellation

    async def handle_user_message(self, message: str):
        """
        The Dual-Track Entry Point
        """
        # 1. Add to history
        self.state.chat_history.append({"role": "user", "content": message})
        
        # 2. Track A: Run Extractor (Fire & Forget)
        asyncio.create_task(self._run_extractor(message))
        
        # 3. Track B: Run Chat Agent (Response)
        # We await this one because the user is waiting for a reply
        await self._run_chat_agent(message)

    async def _run_extractor(self, message: str):
        """
        The Silent Observer. 
        MOCK: If user says 'manager', add a Persona.
        """
        # --- REAL LOGIC WOULD CALL LLM HERE ---
        # simulation:
        if "manager" in message.lower():
            print(f"[{self.state.session_id}] Extractor found Actor: Manager")
            new_persona = {"role_name": "Manager", "responsibilities": "Approvals"}
            
            # UPDATE STATE
            # In real code, use Pydantic model methods
            # self.state.actors.append(Persona(**new_persona)) 
            
            # TRIGGER REACTIVE FLOW
            await self._on_state_change("actors")

    async def _on_state_change(self, changed_field: str):
        """
        The Reactive Logic (The Dependency Graph)
        """
        print(f"State changed: {changed_field}. Checking dependencies...")
        
        # Check Dependency Graph
        # DEPENDENCY_GRAPH = {"actors": ["mermaid_diagram"]}
        affected_artifacts = DEPENDENCY_GRAPH.get(changed_field, [])
        
        for artifact_type in affected_artifacts:
            print(f"Triggering regeneration for: {artifact_type}")
            # Fire & Forget the generator
            asyncio.create_task(self._run_artifact_generator(artifact_type))

    async def _run_artifact_generator(self, artifact_type: str):
        # Notify UI
        await self.emit("AGENT_STATUS", {"type": artifact_type, "status": "generating"})
        
        # Simulate work
        await asyncio.sleep(2)
        
        # Notify UI of result
        await self.emit("ARTIFACT_UPDATE", {"type": artifact_type, "content": "NEW DIAGRAM DATA"})

    async def _run_chat_agent(self, message: str):
        # Simulate thinking
        await asyncio.sleep(1)
        response = f"I heard you say: {message}. I'm analyzing that..."
        self.state.chat_history.append({"role": "ai", "content": response})
        await self.emit("CHAT_MESSAGE", response)