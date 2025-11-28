# app/core/services/requirements.py
from typing import Dict, Any, List, Optional
from app.core.services.state_manager import StateManager
from app.core.gap_engine import GapEngine
from app.agents.checker import CheckerAgent
from app.domain.models.state import SessionState, BusinessGoal, Persona, ProcessStep, DataEntity, NonFunctionalRequirement
from app.domain.models.validation import ComplianceReport

class RequirementsService:
    """
    Orchestrates the 'Update -> Audit -> Feedback' pipeline.
    Separates the 'Agent' (Tool) from the 'Business Logic'.
    """
    def __init__(
        self, 
        state_manager: StateManager,
        gap_engine: GapEngine,
        checker_agent: CheckerAgent
    ):
        self.state_manager = state_manager
        self.gap_engine = gap_engine
        self.checker_agent = checker_agent

    async def process_update(self, session_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """
        Applies updates (Add/Remove) and runs the full audit suite.
        Returns a dict containing the snapshot and RAW issue objects.
        """
        
        # --- 1. Apply Removals FIRST ---
        if updates.get("actors_to_remove"):
            await self.state_manager.remove_actors(session_id, updates["actors_to_remove"])

        if updates.get("steps_to_remove"):
            await self.state_manager.remove_steps(session_id, updates["steps_to_remove"])

        # --- 2. Apply Adds / Updates ---
        if updates.get("project_scope"):
            await self.state_manager.update_project_scope(session_id, updates["project_scope"])

        if updates.get("goal"):
            goal_model = BusinessGoal(**updates["goal"])
            await self.state_manager.update_goal(session_id, goal_model)

        if updates.get("actors_to_add"):
            actors_models = [Persona(**a) for a in updates["actors_to_add"]]
            await self.state_manager.add_actors(session_id, actors_models)

        if updates.get("process_steps"):
            steps_models = [ProcessStep(**s) for s in updates["process_steps"]]
            await self.state_manager.update_steps(session_id, steps_models)

        if updates.get("data_entities"):
            entities = [DataEntity(**d) for d in updates["data_entities"]]
            await self.state_manager.update_data_entities(session_id, entities)

        if updates.get("nfrs"):
            reqs = [NonFunctionalRequirement(**n) for n in updates["nfrs"]]
            await self.state_manager.update_nfrs(session_id, reqs)

        # --- 3. Fetch Fresh State (Read-Your-Writes) ---
        current_state = await self.state_manager.get_or_create_session(session_id)

        # --- 4. Run Logic Audits (Gap Engine - Deterministic) ---
        gap_result = self.gap_engine.analyze(current_state)
        gap_issues = [issue.advice for issue in gap_result.issues]

        # --- 5. Run Compliance Audits (Checker Agent - LLM) ---
        compliance_issues_list = []
        try:
            compliance_report = await self.checker_agent.audit(current_state)
            # We return the raw objects now, so the Mapper (and LLM) can use structured data
            if compliance_report and compliance_report.issues:
                compliance_issues_list = compliance_report.issues
                
        except Exception as e:
            # If the Checker Agent fails (e.g., LLM refusal), we don't crash the update.
            # We just return a warning string in a dummy object or list.
            print(f"⚠️ Compliance check failed: {e}")
            # We leave the list empty or add a string if the caller handles it.
            # For strictness, let's leave it empty so we don't break the object contract.

        # --- 6. Return Structured Feedback ---
        return {
            "status": "success",
            "current_state_snapshot": {
                "scope": current_state.project_scope,
                "actors": len(current_state.actors),
                "steps": len(current_state.process_steps)
            },
            "completeness_gaps": gap_issues,
            
            # RAW OBJECTS (List[ComplianceIssue])
            "compliance_issues": compliance_issues_list,
            
            # Pass the full object for event emission
            "_internal_state": current_state 
        }