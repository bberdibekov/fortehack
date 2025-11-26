from app.domain.gap_rules import IGapRule, GapIssue, GapSeverity
from app.domain.models.state import SessionState
from typing import Optional

class DefineScopeRule(IGapRule):
    def evaluate(self, state: SessionState) -> Optional[GapIssue]:
        if not state.project_scope:
            return GapIssue(
                field="scope",
                severity=GapSeverity.BLOCKER,
                advice="The Project Scope is undefined. We cannot proceed without knowing what we are building."
            )
        return None

class ActorExistenceRule(IGapRule):
    def evaluate(self, state: SessionState) -> Optional[GapIssue]:
        if not state.actors:
            return GapIssue(
                field="actors",
                severity=GapSeverity.CRITICAL,
                advice="No Actors identified. We need to identify WHO interacts with the system."
            )
        return None

class BusinessGoalRule(IGapRule):
    def evaluate(self, state: SessionState) -> Optional[GapIssue]:
        if not state.goal:
            return GapIssue(
                field="goal",
                severity=GapSeverity.CRITICAL,
                advice="Business Goal is missing. We need to know WHY this project exists (KPIs/Outcome)."
            )
        return None

class ProcessDepthRule(IGapRule):
    """
    Example of a logic-heavy rule (not just checking None)
    """
    def evaluate(self, state: SessionState) -> Optional[GapIssue]:
        step_count = len(state.process_steps)
        
        if step_count == 0:
            return GapIssue(
                field="process_steps",
                severity=GapSeverity.CRITICAL,
                advice="No process steps defined. We have the actors, but no workflow."
            )
        
        if step_count < 3:
             return GapIssue(
                field="process_steps",
                severity=GapSeverity.WARNING,
                advice=f"Process is very shallow ({step_count} steps). Dig deeper into the workflow details.",
                missing_data=False # We have data, but it's weak
            )
        return None