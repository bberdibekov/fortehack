# app/core/services/markdown_generator.py
import datetime
from typing import Any
from app.domain.models.state import SessionState

class MarkdownGenerator:
    """
    Pure domain service.
    Responsibility: Convert SessionState into a Markdown Executive Summary string.
    Used by: PublishService (to inject into Confluence/PDF/etc).
    """


        
    def generate(self, state: SessionState) -> str:
        """
        The Assembler Logic. Stitches Ledger + Artifacts into a summary string.
        """
        lines = []
        # Header is often handled by the CMS title, but we include a meta block
        lines.append(f"**Project ID:** {state.session_id}")
        lines.append(f"**Generated:** {datetime.datetime.now().strftime('%Y-%m-%d %H:%M')}")
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
        
        # Note: We do NOT include the Mermaid code block here anymore.
        # The Confluence Publisher attaches the SVG visually. 
        # We can leave a placeholder reference.
        lines.append("\n_(See attached Diagram below)_")
        lines.append("\n")

        # 4. DATA REQUIREMENTS
        lines.append("## 4. Data Dictionary")
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

        # 5. NON-FUNCTIONAL REQUIREMENTS
        lines.append("## 5. System Constraints (NFRs)")
        if state.nfrs:
            for nfr in state.nfrs:
                lines.append(f"- **[{nfr.category}]** {nfr.requirement}")
        else:
            lines.append("_No NFRs defined._")
        lines.append("\n")

        return "\n".join(lines)