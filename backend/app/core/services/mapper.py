# app/core/services/mapper.py
import json
from typing import Any, Dict, List

# Strategies
from app.core.services.artifact_strategies import ArtifactStrategyFactory

# Domain & Contract
from app.domain.models.state import SessionState
from app.schemas.contract import (
    MsgChatDelta, MsgStatusUpdate, MsgArtifactOpen, 
    MsgStateUpdate, MsgValidationWarn, MsgArtifactUpdate,
    StatusUpdatePayload, SystemStatus, ContractStateSnapshot,
    ValidationWarnPayload, ValidationIssue, MsgArtifactUpdatePayload, MsgArtifactSync, ArtifactSyncPayload,MsgChatHistory, ChatMessage, ChatHistoryPayload, MsgSessionEstablished, SessionEstablishedPayload
)



class DomainMapper:
    """
    Central Translation Layer.
    Converts Internal Domain Objects -> External Contract Messages (Strictly Typed).
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
    def to_artifact_open(artifact_type: str, content: Any, doc_id: str) -> Dict[str, Any]:
        """
        Delegates content formatting to the specific strategy.
        Used to OPEN a tab.
        """
        strategy = ArtifactStrategyFactory.get_strategy(artifact_type)
        
        # Map content to the Contract Schema using the provided ID
        contract_artifact = strategy.map(content, doc_id=doc_id)
        
        return MsgArtifactOpen(
            type='ARTIFACT_OPEN',
            payload=contract_artifact
        ).model_dump(by_alias=True)

    @staticmethod
    def to_artifact_update(artifact_type: str, content: Any, doc_id: str) -> Dict[str, Any]:
        """
        Maps content to a strict ARTIFACT_UPDATE message.
        Used to force-refresh content in an existing tab.
        """
        # We reuse the strategy to get the formatted 'content' string/json
        strategy = ArtifactStrategyFactory.get_strategy(artifact_type)
        contract_artifact = strategy.map(content, doc_id=doc_id)
        
        return MsgArtifactUpdate(
            type='ARTIFACT_UPDATE',
            payload=MsgArtifactUpdatePayload(
                id=doc_id,
                content=contract_artifact.content # Extract just the string content
            )
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
    
    @staticmethod
    def to_artifact_sync(doc_id: str, status: str, message: str = "") -> Dict[str, Any]:
        return MsgArtifactSync(
            type='ARTIFACT_SYNC_EVENT',
            payload=ArtifactSyncPayload(
                id=doc_id,
                status=status,
                message=message
            )
        ).model_dump(by_alias=True)
    

    @staticmethod
    def to_chat_history(history: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Filters and formats the raw session history for the UI.
        """
        ui_messages = []
        skipped = 0
        
        for msg in history:
            role = msg.get("role")
            content = msg.get("content")
            
            # Filter: Only show User and Assistant messages. 
            if role in ["user", "assistant"] and content:
                ui_messages.append(ChatMessage(
                    role=role,
                    content=str(content)
                ))
            else:
                skipped += 1
        
        print(f"   🔍 [Mapper] to_chat_history: {len(history)} raw -> {len(ui_messages)} UI messages ({skipped} skipped)")

        return MsgChatHistory(
            type='CHAT_HISTORY',
            payload=ChatHistoryPayload(messages=ui_messages)
        ).model_dump(by_alias=True)
    
    @staticmethod
    def to_session_established(session_id: str, is_new: bool) -> Dict[str, Any]:
        return MsgSessionEstablished(
            type='SESSION_ESTABLISHED',
            payload=SessionEstablishedPayload(
                session_id=session_id,
                is_new=is_new
            )
        ).model_dump(by_alias=True)