# app/core/tools/definitions.py
import json
from app.core.tools.base import BaseTool, ToolContext
from app.core.tools.inputs import UpdateRequirementsInput, TriggerVisualizationInput

class UpdateRequirementsTool(BaseTool):
    name = "update_requirements"
    description = "Saves requirements to the Ledger. ALWAYS runs a Compliance Audit immediately after saving. Returns audit results."
    input_model = UpdateRequirementsInput

    async def execute(self, args: dict, ctx: ToolContext) -> str:
        # 1. Get Service
        req_service = ctx.services.get("requirements_service")
        if not req_service:
             return json.dumps({"error": "Requirements Service not available"})

        # 2. Delegate to Service
        # We assume the service handles the logic of updating state and running agents
        result = await req_service.process_update(ctx.state.session_id, args)

        # 3. Handle Side Effects (Events)
        # The service returns the fresh state in a private key for us to use
        updated_state = result.pop("_internal_state", None)
        
        if updated_state:
            # Update the context's state reference so subsequent tools in the loop see it
            ctx.state = updated_state
            # Emit to UI
            await ctx.emit("STATE_UPDATE", updated_state.dict())
            
            # If there are compliance issues, emit a specific warning event
            if result.get("compliance_issues"):
                 # We assume the issues are strings in the result list
                 await ctx.emit("VALIDATION_WARN", {"issues": result["compliance_issues"]})
            else:
                 await ctx.emit("VALIDATION_WARN", {"issues": []})

        # 4. Return clean JSON to LLM
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
            # The scheduler is expected to be an async wrapper or fire-and-forget
            # passed from the Orchestrator
            scheduler_func(artifact)
            triggered.append(artifact)

        return json.dumps({
            "status": "queued",
            "message": f"Background jobs started for: {triggered}. Tell the user to check the sidebar."
        })