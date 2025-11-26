# app/domain/models/validation.py
from pydantic import BaseModel, Field, field_validator
from typing import List, Literal

# The strict list we WANT, but won't crash on
KNOWN_CATEGORIES = {"security", "policy", "consistency", "completeness", "quality", "business"}

class ComplianceIssue(BaseModel):
    id: str = Field(..., description="Unique ID for this issue")
    severity: Literal["low", "medium", "high", "critical"]
    
    # Changed from Literal to str to accept anything
    category: str 
    
    title: str
    description: str
    suggestion: str

    @field_validator('category', mode='before')
    @classmethod
    def normalize_category(cls, v: str) -> str:
        """
        Robustness: If LLM hallucinates a new category, map it to 'policy'.
        """
        normalized = v.lower().strip()
        if normalized in KNOWN_CATEGORIES:
            return normalized
        
        # Log valid warning in production
        # print(f"⚠️ Coercing unknown category '{v}' to 'policy'")
        return "policy"

class ComplianceReport(BaseModel):
    issues: List[ComplianceIssue]
    safety_score: int = Field(..., description="0-100 score")