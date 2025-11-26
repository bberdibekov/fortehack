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
        contract_artifact = strategy.map(content, doc_id="artifact-latest")
        
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
    def to_validation_warn(issues: List[str], score: int = 100) -> Dict[str, Any]:
        """
        Maps list of issue strings -> Structured Validation Payload
        """
        # Convert strings to objects (simplistic mapping, strictly speaking 
        # the checker should return objects, but we handle the string list here)
        issue_objs = []
        for i_str in issues:
            # Basic parsing if string contains severity like "[CRITICAL] ..."
            severity = "medium"
            msg = i_str
            if "[" in i_str and "]" in i_str:
                end = i_str.find("]")
                severity = i_str[1:end].lower()
                msg = i_str[end+1:].strip()
                
            issue_objs.append(ValidationIssue(severity=severity, message=msg))

        return MsgValidationWarn(
            type='VALIDATION_WARN',
            payload=ValidationWarnPayload(issues=issue_objs, safety_score=score)
        ).model_dump(by_alias=True)