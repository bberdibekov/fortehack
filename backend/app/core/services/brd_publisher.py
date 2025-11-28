# app/core/services/publisher.py
import os
import json
import datetime
import asyncio
from typing import List, Dict, Any
from app.domain.models.state import SessionState
from app.utils.logger import setup_logger

logger = setup_logger("PublishService")

class PublishService:
    """
    Assembles the 'Living Ledger' and 'Artifacts' into a formal BRD (Markdown).
    Saves to local disk to simulate publishing.
    """
    
    def __init__(self):
        # Create an exports directory
        self.export_dir = os.path.join(os.getcwd(), "data", "exports")
        os.makedirs(self.export_dir, exist_ok=True)

    async def publish(self, state: SessionState, target: str) -> str:
        logger.info(f"🚀 Generatng BRD for Target: {target}")
        
        # 1. Assemble the Document
        brd_content = self._generate_markdown(state)
        
        # 2. Save to Disk (Simulating an "Artifact" that can be uploaded)
        timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"BRD_{state.session_id[:8]}_{timestamp}.md"
        filepath = os.path.join(self.export_dir, filename)
        
        try:
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(brd_content)
            
            logger.info(f"✅ BRD Saved: {filepath}")
            
            # 3. Return a "Link" (In reality, this would be the Confluence URL)
            # For local dev, we return the absolute file path
            return f"file://{os.path.abspath(filepath)}"
            
        except Exception as e:
            logger.error(f"❌ Failed to write BRD: {e}")
            raise e

    def _generate_markdown(self, state: SessionState) -> str:
        """
        The Assembler Logic. Stitches Ledger + Artifacts.
        """
        lines = []
        lines.append(f"# Business Requirements Document (BRD)")
        lines.append(f"**Project ID:** {state.session_id}")
        lines.append(f"**Date:** {datetime.datetime.now().strftime('%Y-%m-%d')}")
        lines.append("\n---\n")

        # 1. EXECUTIVE SUMMARY
        lines.append("## 1. Executive Summary")
        if state.project_scope:
            lines.append(f"### 1.1 Scope\n{state.project_scope}")
        
        if state.goal:
            lines.append(f"### 1.2 Business Goal\n**{state.goal.main_goal}**")
            if state.goal.success_metrics:
                lines.append("\n**Key Success Metrics (KPIs):**")
                for kpi in state.goal.success_metrics:
                    lines.append(f"- {kpi}")
        lines.append("\n")

        # 2. STAKEHOLDERS
        lines.append("## 2. Actors & Stakeholders")
        if state.actors:
            lines.append("| Role | Responsibilities |")
            lines.append("| :--- | :--- |")
            for actor in state.actors:
                lines.append(f"| **{actor.role_name}** | {actor.responsibilities or 'N/A'} |")
        else:
            lines.append("_No actors defined._")
        lines.append("\n")

        # 3. BUSINESS PROCESS
        lines.append("## 3. Business Process Flow")
        
        # 3.1 Text Steps
        lines.append("### 3.1 High-Level Steps")
        if state.process_steps:
            for step in state.process_steps:
                lines.append(f"1. **{step.actor}**: {step.description}")
        else:
            lines.append("_No process steps defined._")
        
        # 3.2 Diagram Code (Mermaid)
        lines.append("\n### 3.2 Visualization (Mermaid)")
        mermaid_code = self._get_artifact_content(state, "mermaid_diagram", "code")
        if mermaid_code:
            lines.append("```mermaid")
            lines.append(mermaid_code)
            lines.append("```")
        else:
            lines.append("_No diagram generated._")
        lines.append("\n")

        # 4. FUNCTIONAL REQUIREMENTS
        lines.append("## 4. Functional Requirements")

        # 4.1 Use Cases
        lines.append("### 4.1 Detailed Use Cases")
        use_cases = self._get_artifact_content(state, "use_case", "use_cases")
        if use_cases and isinstance(use_cases, list):
            for uc in use_cases:
                lines.append(f"#### UC-{uc.get('id', '?')}: {uc.get('title', 'Untitled')}")
                lines.append(f"- **Primary Actor:** {uc.get('primary_actor', 'Unknown')}")
                
                pre = uc.get('preconditions', [])
                if pre: lines.append(f"- **Preconditions:** {', '.join(pre)}")
                
                lines.append(f"- **Main Flow:**")
                for step in uc.get('main_flow', []):
                    lines.append(f"  {step.get('step_number')}. {step.get('action')}")
                    if step.get('alternative_flow'):
                        lines.append(f"    - *Alt:* {step.get('alternative_flow')}")
                lines.append("\n")
        else:
            lines.append("_No use cases defined._")

        # 4.2 User Stories
        lines.append("### 4.2 User Stories (Backlog)")
        stories = self._get_artifact_content(state, "user_story", "stories")
        if stories and isinstance(stories, list):
            lines.append("| ID | Story | Estimate | Priority |")
            lines.append("| :--- | :--- | :--- | :--- |")
            for s in stories:
                desc = s.get('title') or s.get('description', '')
                est = s.get('estimate', '-')
                prio = s.get('priority', 'Medium')
                lines.append(f"| {s.get('id')} | {desc} | {est} | {prio} |")
        else:
            lines.append("_No user stories defined._")
        lines.append("\n")

        # 5. DATA REQUIREMENTS
        lines.append("## 5. Data Dictionary")
        if state.data_entities:
            for entity in state.data_entities:
                lines.append(f"### {entity.name}")
                if entity.description:
                    lines.append(f"_{entity.description}_")
                if entity.fields:
                    lines.append(f"- Fields: `{', '.join(entity.fields)}`")
        else:
            lines.append("_No specific data entities defined._")
        lines.append("\n")

        # 6. NON-FUNCTIONAL REQUIREMENTS
        lines.append("## 6. System Constraints (NFRs)")
        if state.nfrs:
            for nfr in state.nfrs:
                lines.append(f"- **[{nfr.category}]** {nfr.requirement}")
        else:
            lines.append("_No NFRs defined._")
        lines.append("\n")

        return "\n".join(lines)

    def _get_artifact_content(self, state: SessionState, artifact_type: str, key_to_extract: str) -> Any:
        """Helper to safely extract data from the latest version of an artifact."""
        version = state.artifact_counters.get(artifact_type, 0)
        if version == 0:
            return None
        
        internal_id = f"{artifact_type}-v{version}"
        data = state.artifacts.get(internal_id)
        
        if not data:
            return None
            
        # Handle string vs dict data (Mermaid is stored as dict {"code":...} by EditStrategy)
        if isinstance(data, dict):
            return data.get(key_to_extract)
        
        return None