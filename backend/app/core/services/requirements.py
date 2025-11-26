# app/core/services/requirements.py
from typing import Dict, Any, List, Optional
from app.core.services.state_manager import StateManager
from app.core.gap_engine import GapEngine
from app.agents.checker import CheckerAgent
from app.domain.models.state import SessionState, BusinessGoal, Persona, ProcessStep
from app.domain.models.validation import ComplianceReport 

class RequirementsService:
    """
    Orchestrates the 'Update -> Audit -> Feedback' pipeline.
    This separates the 'Agent' (Tool) from the 'Business Logic'.
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
        Applies updates and runs the full audit suite.
        """
        
        # 1. Apply Removals FIRST (Logic: Remove then Add prevents conflicts)
        if updates.get("actors_to_remove"):
            await self.state_manager.remove_actors(session_id, updates["actors_to_remove"])

        if updates.get("steps_to_remove"):
            await self.state_manager.remove_steps(session_id, updates["steps_to_remove"])
        
        # 2. Apply Adds / Updates
               
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

        # 3. Fetch Fresh State (Read-Your-Writes)
        current_state = await self.state_manager.get_or_create_session(session_id)

        # 4. Run Logic Audits (Gap Engine - Deterministic)
        gap_result = self.gap_engine.analyze(current_state)
        gap_issues = [issue.advice for issue in gap_result.issues]

        # 5. Run Compliance Audits (Checker Agent - LLM)
        compliance_issues = []
        try:
            compliance_report = await self.checker_agent.audit(current_state)
            if compliance_report.issues:
                compliance_issues = [
                    f"[{i.severity.upper()}] {i.title}: {i.description}" 
                    for i in compliance_report.issues
                ]
        except Exception as e:
            compliance_issues = [f"System Warning: Compliance check unavailable ({str(e)})"]

        # 6. Return Structured Feedback
        return {
            "status": "success",
            "current_state_snapshot": {
                "scope": current_state.project_scope,
                "actors": len(current_state.actors),
                "steps": len(current_state.process_steps)
            },
            "completeness_gaps": gap_issues,
            "compliance_issues": compliance_issues,
            # Pass the full object for event emission if needed
            "_internal_state": current_state 
        }