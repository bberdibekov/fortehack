from pydantic import BaseModel, Field
from typing import List, Literal

class ComplianceIssue(BaseModel):
    id: str = Field(..., description="Unique ID for this issue")
    severity: Literal["low", "medium", "high", "critical"]
    category: Literal["security", "policy", "consistency", "completeness"]
    title: str
    description: str
    suggestion: str

class ComplianceReport(BaseModel):
    issues: List[ComplianceIssue]
    safety_score: int = Field(..., description="0-100 score of how safe/compliant the requirements are")