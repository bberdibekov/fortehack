# app/core/services/mapper.py
import json
from typing import Any, Dict, List

# Strategies
from app.core.services.artifact_strategies import ArtifactStrategyFactory

# Domain & Contract
from app.domain.models.state import SessionState
from app.schemas.contract import (
    MsgChatDelta, MsgStatusUpdate, MsgArtifactOpen, 
    MsgStateUpdate, MsgValidationWarn,
    StatusUpdatePayload, SystemStatus, ContractStateSnapshot,
    ValidationWarnPayload, ValidationIssue
)

class DomainMapper:
    """
    Central Translation Layer.
    """

    # --- 1. Basic Messages ---
    
    @staticmethod
    def to_chat_delta(content: str) -> Dict[str, Any]:
        return MsgChatDelta(
            type='CHAT_DELTA', 
            payload=content
        ).model_dump(by_alias=True)

    @staticmethod
    def to_status_update(status: str, message: str) -> Dict[str, Any]:
        try:
            status_enum = SystemStatus(status.lower())
        except ValueError:
            status_enum = SystemStatus.WORKING
            
        return MsgStatusUpdate(
            type='STATUS_UPDATE',
            payload=StatusUpdatePayload(status=status_enum, message=message)
        ).model_dump(by_alias=True)

    # --- 2. Artifacts (STRATEGY PATTERN) ---

    @staticmethod
    def to_artifact_open(artifact_type: str, content: Any) -> Dict[str, Any]:
        """
        Delegates content formatting to the specific strategy.
        """
        strategy = ArtifactStrategyFactory.get_strategy(artifact_type)
        unique_id = f"artifact-{artifact_type}"
        contract_artifact = strategy.map(content, doc_id=unique_id)
        
        return MsgArtifactOpen(
            type='ARTIFACT_OPEN',
            payload=contract_artifact
        ).model_dump(by_alias=True)

    # --- 3. New Events (State & Validation) ---

    @staticmethod
    def to_state_update(state: SessionState) -> Dict[str, Any]:
        """
        Maps Internal SessionState -> ContractStateSnapshot
        """
        # Pydantic's from_attributes=True in ContractStateSnapshot 
        # allows it to read directly from the SessionState object.
        snapshot = ContractStateSnapshot.model_validate(state)
        
        return MsgStateUpdate(
            type='STATE_UPDATE',
            payload=snapshot
        ).model_dump(by_alias=True)

    @staticmethod
    def to_validation_warn(issues: List[Any], score: int = 100) -> Dict[str, Any]:
        """
        Maps list of Internal ComplianceIssue objects -> Contract ValidationWarnPayload
        """
        contract_issues = []
        
        for issue in issues:
            # Handle if issue is a String (legacy/fallback) vs Object (normal)
            if isinstance(issue, str):
                contract_issues.append(ValidationIssue(
                    severity="medium",
                    category="policy",
                    message=issue
                ))
            else:
                # Issue is a ComplianceIssue object
                contract_issues.append(ValidationIssue(
                    severity=issue.severity,
                    category=issue.category, # This is now safe/normalized
                    message=f"{issue.title}: {issue.description}"
                ))

        return MsgValidationWarn(
            type='VALIDATION_WARN',
            payload=ValidationWarnPayload(issues=contract_issues, safety_score=score)
        ).model_dump(by_alias=True)