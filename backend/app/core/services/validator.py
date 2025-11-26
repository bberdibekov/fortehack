# app/core/services/validator.py
from typing import List, Dict, Any
from app.domain.models.state import SessionState
from app.domain.models.validation import ComplianceIssue

class ConsistencyValidator:
    """
    Registry of deterministic validation strategies.
    Each method matches the signature: (content: Dict, state: SessionState) -> List[ComplianceIssue]
    """

    @staticmethod
    def validate_mermaid(content: Dict[str, Any], state: SessionState) -> List[ComplianceIssue]:
        issues = []
        code = content.get("code", "")
        if not code:
            return []

        code_lower = code.lower()
        
        for actor in state.actors:
            role = actor.role_name
            # Check: Is the Role Name present in the code?
            # We use a simple containment check. 
            if role.lower() not in code_lower:
                issues.append(ComplianceIssue(
                    id=f"missing-actor-mermaid-{role}",
                    severity="medium",
                    category="consistency",
                    title="Missing Actor in Diagram",
                    description=f"The actor '{role}' is defined in the project but does not appear in the diagram.",
                    suggestion=f"Add a 'participant {role}' line to the Mermaid code."
                ))
        return issues

    @staticmethod
    def validate_stories(content: Dict[str, Any], state: SessionState) -> List[ComplianceIssue]:
        issues = []
        
        # 1. Parse Generated Stories
        # content is the dict dump of StoryArtifact
        stories_list = content.get("stories", [])
        
        # Create a set of "Covered Actors" (normalized to lowercase)
        # We look at the "as_a" field from the User Story format
        covered_roles = set()
        for story in stories_list:
            role = story.get("as_a", "")
            if role:
                covered_roles.add(role.lower().strip())
        
        # 2. Compare against System State
        for actor in state.actors:
            required_role = actor.role_name.lower().strip()
            
            # Check coverage
            # We use strict string matching here. 
            # Note: If LLM says "Senior Loan Officer" and state is "Loan Officer", this might flag.
            # Ideally, we check for partial match, but for now strict is safer to force alignment.
            is_covered = False
            for covered in covered_roles:
                if required_role in covered or covered in required_role:
                    is_covered = True
                    break
            
            if not is_covered:
                issues.append(ComplianceIssue(
                    id=f"missing-story-actor-{required_role}",
                    severity="medium",
                    category="consistency",
                    title="Missing User Story for Actor",
                    description=f"The actor '{actor.role_name}' exists in the system but has no User Stories assigned.",
                    suggestion=f"Ask the agent to generate a story: 'As a {actor.role_name}, I want to...'"
                ))
                
        return issues