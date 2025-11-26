# app/core/tools/definitions.py
import json
from app.core.tools.base import BaseTool, ToolContext
from app.core.tools.inputs import UpdateRequirementsInput, TriggerVisualizationInput
from app.core.services.mapper import DomainMapper
from pydantic import ValidationError

class UpdateRequirementsTool(BaseTool):
    name = "update_requirements"
    description = "Saves requirements to the Ledger. ALWAYS runs a Compliance Audit immediately after saving. Returns audit results."
    input_model = UpdateRequirementsInput

    async def execute(self, args: dict, ctx: ToolContext) -> str:
        try:
            # 1. Get Service
            req_service = ctx.services.get("requirements_service")
            if not req_service:
                 return json.dumps({"error": "Requirements Service not available"})

            # 2. Delegate to Service
            result = await req_service.process_update(ctx.state.session_id, args)

            # 3. Handle Side Effects
            updated_state = result.pop("_internal_state", None)
            
            if updated_state:
                ctx.state = updated_state
                
                # Mapper Calls
                msg_state = DomainMapper.to_state_update(updated_state)
                await ctx.emit(msg_state["type"], msg_state["payload"])
                
                # Compliance Warnings
                compliance_issues = result.get("compliance_issues", [])
                if compliance_issues:
                    # Calculate Score
                    safety_score = max(0, 100 - (len(compliance_issues) * 10))
                    msg_warn = DomainMapper.to_validation_warn(compliance_issues, score=safety_score)
                    await ctx.emit(msg_warn["type"], msg_warn["payload"])
                else:
                    msg_warn = DomainMapper.to_validation_warn([], score=100)
                    await ctx.emit(msg_warn["type"], msg_warn["payload"])

                msg_status = DomainMapper.to_status_update("success", "Requirements Ledger updated.")
                await ctx.emit(msg_status["type"], msg_status["payload"])

            # 4. Serialize for LLM
            # We need to serialize the ComplianceIssue objects into Dicts/Strings for the LLM response
            # because json.dumps cannot handle Pydantic objects directly.
            
            final_response = result.copy()
            if "compliance_issues" in final_response:
                # Convert objects to simple dicts for the LLM
                final_response["compliance_issues"] = [
                    i.model_dump() if hasattr(i, "model_dump") else str(i)
                    for i in final_response["compliance_issues"]
                ]

            return json.dumps(final_response)

        except ValidationError as e:
            # CATCH PYDANTIC CRASHES (e.g. Invalid Enums in Tool Input)
            # Return a simple error so the LLM doesn't try to debug Python
            return json.dumps({
                "status": "error",
                "message": f"Invalid input format. Please check your arguments. ({str(e.errors()[0].get('msg'))})"
            })
            
        except Exception as e:
            # CATCH GENERAL CRASHES
            print(f"🔥 Tool Execution Error: {e}")
            return json.dumps({
                "status": "error",
                "message": "Internal System Error while saving requirements. Please try again with simpler input."
            })

class TriggerVisualizationTool(BaseTool):
    name = "trigger_visualization"
    description = "Queues artifact generation (Diagrams, Stories). ONLY call this if 'update_requirements' returns no blocking compliance errors."
    input_model = TriggerVisualizationInput

    async def execute(self, args: dict, ctx: ToolContext) -> str:
        try:
            scheduler_func = ctx.services.get("scheduler")
            if not scheduler_func:
                return json.dumps({"error": "Scheduler service not available"})

            artifact_types = args.get("artifact_types", [])
            
            if not ctx.state.project_scope and not ctx.state.actors:
                return json.dumps({
                    "status": "failed", 
                    "reason": "State is empty. Cannot visualize yet."
                })

            triggered = []
            for artifact in artifact_types:
                scheduler_func(artifact)
                triggered.append(artifact)

            return json.dumps({
                "status": "queued",
                "message": f"Background jobs started for: {triggered}."
            })
            
        except Exception as e:
            return json.dumps({"status": "error", "message": str(e)})