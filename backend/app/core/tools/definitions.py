# app/core/tools/definitions.py
import json
from pydantic import ValidationError
from app.core.tools.base import BaseTool, ToolContext
from app.core.tools.inputs import (
    UpdateRequirementsInput, 
    TriggerVisualizationInput, 
    InspectArtifactInput, 
    PatchArtifactInput
)
from app.core.services.mapper import DomainMapper
from app.core.services.search_strategies import SearchStrategyFactory

# --- TOOL 1: Update Requirements (The Ledger) ---
class UpdateRequirementsTool(BaseTool):
    name = "update_requirements"
    description = "Saves requirements to the Ledger (Scope, Actors, Goals, Steps, Data, NFRs). ALWAYS runs a Compliance Audit immediately after saving. Returns audit results."
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
                compliance_issues = result.get("compliance_issues") or []
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
            final_response = result.copy()
            if "compliance_issues" in final_response:
                # Convert objects to simple dicts for the LLM
                final_response["compliance_issues"] = [
                    i.model_dump() if hasattr(i, "model_dump") else str(i)
                    for i in final_response["compliance_issues"]
                ]

            return json.dumps(final_response)

        except ValidationError as e:
            return json.dumps({
                "status": "error",
                "message": f"Invalid input format. Please check your arguments. ({str(e.errors()[0].get('msg'))})"
            })
            
        except Exception as e:
            print(f"🔥 Tool Execution Error: {e}")
            return json.dumps({
                "status": "error",
                "message": "Internal System Error while saving requirements."
            })

# --- TOOL 2: Trigger Visualization (The Generators) ---
class TriggerVisualizationTool(BaseTool):
    name = "trigger_visualization"
    description = "Queues artifact generation (Diagrams, Stories, Workbook, Use Cases). ONLY call this if 'update_requirements' returns no blocking compliance errors."
    input_model = TriggerVisualizationInput

    async def execute(self, args: dict, ctx: ToolContext) -> str:
        try:
            scheduler_func = ctx.services.get("scheduler")
            if not scheduler_func:
                return json.dumps({"error": "Scheduler service not available"})

            artifact_types = args.get("artifact_types", [])
            
            # Simple heuristic check
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

# --- TOOL 3: Inspect Artifact (The Searcher) ---
class InspectArtifactTool(BaseTool):
    name = "inspect_artifact"
    description = "Read details from an existing artifact. Use this before answering questions about specific estimates, criteria, or steps."
    input_model = InspectArtifactInput

    async def execute(self, args: dict, ctx: ToolContext) -> str:
        a_type = args.get("artifact_type")
        query = args.get("query")
        
        # 1. Get Strategy (OCP Compliant)
        strategy = SearchStrategyFactory.get_strategy(a_type)
        if not strategy:
            return json.dumps({"error": f"Artifact type '{a_type}' is not searchable."})

        # 2. Get Data
        state = ctx.state
        version = state.artifact_counters.get(a_type, 0)
        if version == 0:
            return json.dumps({"error": f"No {a_type} generated yet."})
            
        key = f"{a_type}-v{version}"
        data = state.artifacts.get(key)
        
        if not data:
            return json.dumps({"error": "Artifact empty."})

        # 3. Execute Strategy
        item, _ = strategy.find_item(data, query)
        
        if item:
            return json.dumps(item)
        else:
            return json.dumps({"error": f"Item matching '{query}' not found in {a_type}."})

# --- TOOL 4: Patch Artifact (The Editor) ---
class PatchArtifactTool(BaseTool):
    name = "patch_artifact"
    description = "Surgically update a specific item (User Story, Use Case) without regenerating the whole list. Use for estimates, priorities, or minor text fixes."
    input_model = PatchArtifactInput

    async def execute(self, args: dict, ctx: ToolContext) -> str:
        a_type = args.get("artifact_type")
        key_query = args.get("search_key")
        raw_updates = args.get("updates_json", "{}")
        
        # 1. Get Strategy
        strategy = SearchStrategyFactory.get_strategy(a_type)
        if not strategy:
             return json.dumps({"error": f"Artifact type '{a_type}' is not patchable."})
        
        state = ctx.state
        version = state.artifact_counters.get(a_type, 0)
        if version == 0:
             return json.dumps({"error": f"No {a_type} to update."})

        internal_id = f"{a_type}-v{version}"
        data = state.artifacts.get(internal_id) # Mutable Ref

        # 2. Find Item
        item, _ = strategy.find_item(data, key_query)
        
        if not item:
            return json.dumps({"error": f"Could not find item '{key_query}' to patch."})

        # 3. Apply Updates
        for k, v in raw_updates.items():
            item[k] = v
            
        # 4. Save
        await ctx.state_manager.save_session(state)
        
        # 5. Trigger UI Update
        wire_id = a_type 
        msg = DomainMapper.to_artifact_update(a_type, data, doc_id=wire_id)
        await ctx.emit(msg["type"], msg["payload"])
        
        return json.dumps({"status": "success", "updated_item": item})