# app/core/tools/definitions.py
import json
from app.core.tools.base import BaseTool, ToolContext
from app.core.tools.inputs import UpdateRequirementsInput, TriggerVisualizationInput
from app.core.services.mapper import DomainMapper

class UpdateRequirementsTool(BaseTool):
    name = "update_requirements"
    description = "Saves requirements to the Ledger. ALWAYS runs a Compliance Audit immediately after saving. Returns audit results."
    input_model = UpdateRequirementsInput

    async def execute(self, args: dict, ctx: ToolContext) -> str:
        """
        Executes the 'Save + Audit' pipeline via the RequirementsService.
        Emits strictly typed events to the Frontend.
        """
        # 1. Get Service
        req_service = ctx.services.get("requirements_service")
        if not req_service:
             return json.dumps({"error": "Requirements Service not available"})

        # 2. Delegate to Service (Business Logic)
        # This handles Adding, Removing, and Gap/Compliance Analysis
        result = await req_service.process_update(ctx.state.session_id, args)

        # 3. Handle Side Effects (Events)
        # The service returns the fresh state in a private key '_internal_state'
        updated_state = result.pop("_internal_state", None)
        
        if updated_state:
            # A. Update the context's state reference (for the rest of the agent loop)
            ctx.state = updated_state
            
            # B. Emit STATE_UPDATE (Strictly Typed)
            # This refreshes the 'Data' tab in the UI
            msg_state = DomainMapper.to_state_update(updated_state)
            await ctx.emit(msg_state["type"], msg_state["payload"])
            
            # C. Emit VALIDATION_WARN (Strictly Typed)
            # This triggers the 'Safety' indicator in the UI
            compliance_issues = result.get("compliance_issues", [])
            if compliance_issues:
                # We calculate a rough score based on issues (start at 100, minus 10 per issue)
                # In the future, the CheckerAgent should return the score directly in the result dict
                safety_score = max(0, 100 - (len(compliance_issues) * 10))
                
                msg_warn = DomainMapper.to_validation_warn(compliance_issues, score=safety_score)
                await ctx.emit(msg_warn["type"], msg_warn["payload"])
            else:
                # Clear warnings if safe
                msg_warn = DomainMapper.to_validation_warn([], score=100)
                await ctx.emit(msg_warn["type"], msg_warn["payload"])

            # D. Emit STATUS_UPDATE (UX Feedback)
            msg_status = DomainMapper.to_status_update("success", "Requirements Ledger updated.")
            await ctx.emit(msg_status["type"], msg_status["payload"])

        # 4. Return clean JSON to LLM (Compliance issues are text strings here)
        return json.dumps(result)


class TriggerVisualizationTool(BaseTool):
    name = "trigger_visualization"
    description = "Queues artifact generation (Diagrams, Stories). ONLY call this if 'update_requirements' returns no blocking compliance errors."
    input_model = TriggerVisualizationInput

    async def execute(self, args: dict, ctx: ToolContext) -> str:
        """
        Triggers background tasks via the Scheduler service.
        """
        scheduler_func = ctx.services.get("scheduler")
        if not scheduler_func:
            return json.dumps({"error": "Scheduler service not available"})

        artifact_types = args.get("artifact_types", [])
        
        # Validation: Don't generate if state is essentially empty
        if not ctx.state.project_scope and not ctx.state.actors:
            return json.dumps({
                "status": "failed", 
                "reason": "State is empty. Cannot visualize yet."
            })

        triggered = []
        for artifact in artifact_types:
            # The scheduler is a fire-and-forget async wrapper passed from Orchestrator
            scheduler_func(artifact)
            triggered.append(artifact)

        # We don't emit ARTIFACT_OPEN here because the background task will do it 
        # when it finishes generation.
        
        return json.dumps({
            "status": "queued",
            "message": f"Background jobs started for: {triggered}. Tell the user to check the sidebar."
        })