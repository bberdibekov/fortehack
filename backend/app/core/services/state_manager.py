# app/core/services/state_manager.py
from typing import List
from app.domain.models.state import SessionState, Persona, BusinessGoal, ProcessStep, DataEntity, NonFunctionalRequirement
from app.core.interfaces.repository import ISessionRepository
from app.utils.logger import setup_logger

logger = setup_logger("StateManager")

class StateManager:
    """
    Domain Service for managing Session State.
    Coordinates business logic for state updates (merging, deduping).
    Delegates storage to ISessionRepository.
    """
    
    def __init__(self, repository: ISessionRepository):
        self.repo = repository

    async def get_or_create_session(self, session_id: str) -> SessionState:
        """Loads state from Repo or creates a new one if missing."""
        state = await self.repo.get(session_id)
        if not state:
            logger.info(f"✨ Creating new session: {session_id}")
            state = SessionState(session_id=session_id)
            await self.repo.save(state)
        return state

    async def save_session(self, state: SessionState):
        """Pass-through to repository for generic saves."""
        await self.repo.save(state)

    async def update_project_scope(self, session_id: str, scope: str) -> SessionState:
        state = await self.get_or_create_session(session_id)
        state.project_scope = scope
        await self.repo.save(state)
        return state

    async def update_goal(self, session_id: str, goal: BusinessGoal) -> SessionState:
        state = await self.get_or_create_session(session_id)
        state.goal = goal
        await self.repo.save(state)
        return state

    async def add_actors(self, session_id: str, new_actors: List[Persona]) -> SessionState:
        """Business Logic: Add actors with case-insensitive deduplication."""
        state = await self.get_or_create_session(session_id)
        
        existing_roles = {a.role_name.lower() for a in state.actors}
        changed = False
        
        for actor in new_actors:
            if actor.role_name.lower() not in existing_roles:
                state.actors.append(actor)
                existing_roles.add(actor.role_name.lower())
                changed = True
                logger.info(f"➕ Added Actor: {actor.role_name}")
        
        if changed:
            await self.repo.save(state)
            
        return state

    async def remove_actors(self, session_id: str, role_names: List[str]) -> SessionState:
        """Removes actors by role name (case-insensitive)."""
        state = await self.get_or_create_session(session_id)
        
        # Normalize targets to lower case for comparison
        targets = {r.lower() for r in role_names}
        
        # Filter out matching actors
        original_count = len(state.actors)
        state.actors = [a for a in state.actors if a.role_name.lower() not in targets]
        
        if len(state.actors) < original_count:
            await self.repo.save(state)
            logger.info(f"🗑️ Removed actors: {role_names}")
            
        return state

    async def remove_steps(self, session_id: str, step_ids: List[int]) -> SessionState:
        """Removes process steps by ID."""
        state = await self.get_or_create_session(session_id)
        
        original_count = len(state.process_steps)
        state.process_steps = [s for s in state.process_steps if s.step_id not in step_ids]
        
        if len(state.process_steps) < original_count:
            await self.repo.save(state)
            logger.info(f"🗑️ Removed steps: {step_ids}")
            
        return state

    
    async def update_steps(self, session_id: str, steps: List[ProcessStep]) -> SessionState:
        state = await self.get_or_create_session(session_id)
        state.process_steps = steps
        await self.repo.save(state)
        return state
    
    async def update_data_entities(self, session_id: str, new_entities: List[DataEntity]) -> SessionState:
        state = await self.get_or_create_session(session_id)
        
        existing_map = {d.name.lower(): d for d in state.data_entities}
        
        for entity in new_entities:
            key = entity.name.lower()
            if key in existing_map:
                # Merge Fields (Union)
                current_fields = set(existing_map[key].fields)
                new_fields = set(entity.fields)
                existing_map[key].fields = list(current_fields.union(new_fields))
            else:
                state.data_entities.append(entity)
                existing_map[key] = entity
                
        await self.repo.save(state)
        return state

    async def update_nfrs(self, session_id: str, new_nfrs: List[NonFunctionalRequirement]) -> SessionState:
        state = await self.get_or_create_session(session_id)
        
        # Simple Append for now (NFRs are hard to dedup semantically without embeddings)
        # We just check for exact string match on 'requirement'
        existing_reqs = {n.requirement.lower() for n in state.nfrs}
        
        for nfr in new_nfrs:
            if nfr.requirement.lower() not in existing_reqs:
                state.nfrs.append(nfr)
                existing_reqs.add(nfr.requirement.lower())
                
        await self.repo.save(state)
        return state