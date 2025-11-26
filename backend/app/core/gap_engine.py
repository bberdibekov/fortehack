from typing import List
from app.domain.models.state import SessionState
from app.domain.gap_rules import IGapRule, GapIssue
from typing import Optional


from app.core.rules.gap_strategies import (
    DefineScopeRule, 
    ActorExistenceRule, 
    BusinessGoalRule, 
    ProcessDepthRule
)

class GapAnalysisResult:
    def __init__(self, issues: List[GapIssue]):
        self.issues = issues
        # Sort by Severity Descending
        self.issues.sort(key=lambda x: x.severity, reverse=True)

    @property
    def highest_priority_issue(self) -> Optional[GapIssue]:
        return self.issues[0] if self.issues else None

    @property
    def completeness_score(self) -> int:
        # Simple heuristic: 100 - (sum of severities)
        # In a real app, use weighted scoring based on passed rules vs total rules
        penalty = sum([i.severity.value * 10 for i in self.issues])
        return max(0, 100 - penalty)

class GapEngine:
    def __init__(self):
        # In a real framework, use Dependency Injection or a config file to load these
        self.rules: List[IGapRule] = [
            DefineScopeRule(),
            ActorExistenceRule(),
            BusinessGoalRule(),
            ProcessDepthRule()
        ]

    def analyze(self, state: SessionState) -> GapAnalysisResult:
        detected_issues = []
        
        for rule in self.rules:
            issue = rule.evaluate(state)
            if issue:
                detected_issues.append(issue)
                
        return GapAnalysisResult(detected_issues)