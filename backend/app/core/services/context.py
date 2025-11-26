# app/core/services/context.py
from abc import ABC, abstractmethod
from typing import List, Optional
from app.domain.models.state import SessionState

# --- 1. The Interface ---
class IContextSection(ABC):
    """
    Strategy interface for formatting a specific slice of the SessionState.
    """
    @property
    @abstractmethod
    def header(self) -> str:
        pass

    @abstractmethod
    def render(self, state: SessionState) -> Optional[str]:
        """
        Returns the formatted string for this section, or None if data is missing.
        """
        pass

# --- 2. Concrete Sections ---

class ScopeSection(IContextSection):
    header = "PROJECT SCOPE"
    
    def render(self, state: SessionState) -> Optional[str]:
        return state.project_scope or "Undefined"

class GoalSection(IContextSection):
    header = "BUSINESS GOALS & KPIs"
    
    def render(self, state: SessionState) -> Optional[str]:
        if not state.goal:
            return None
            
        lines = [f"Main Goal: {state.goal.main_goal}"]
        if state.goal.success_metrics:
            lines.append("Success Metrics (KPIs):")
            lines.extend([f"- {m}" for m in state.goal.success_metrics])
        
        return "\n".join(lines)

class ActorSection(IContextSection):
    header = "DEFINED ACTORS (Must be respected)"
    
    def render(self, state: SessionState) -> Optional[str]:
        if not state.actors:
            return "No actors defined yet."
            
        # Format: - [Role Name]: Responsibilities
        return "\n".join([
            f"- [{a.role_name}]: {a.responsibilities or 'No specific role defined'}" 
            for a in state.actors
        ])

class ProcessSection(IContextSection):
    header = "PROCESS FLOW (Sequence of Events)"
    
    def render(self, state: SessionState) -> Optional[str]:
        if not state.process_steps:
            return None
            
        # Format: 1. Actor -> Description
        return "\n".join([
            f"{s.step_id}. {s.actor} -> {s.description}" 
            for s in state.process_steps
        ])

# --- 3. The Pipeline Engine ---

class ContextPipeline:
    """
    Orchestrates the assembly of the System Context.
    """
    def __init__(self):
        # Register default sections in logical order
        self._sections: List[IContextSection] = [
            ScopeSection(),
            GoalSection(),
            ActorSection(),
            ProcessSection()
            # Future: RiskSection(), DataModelSection(), etc.
        ]

    def add_section(self, section: IContextSection):
        """Allow dynamic extension of the pipeline"""
        self._sections.append(section)

    def build(self, state: SessionState) -> str:
        """
        Iterates through sections and builds the Golden Context block.
        """
        blocks = []
        blocks.append("=== PROJECT CONTEXT (Source of Truth) ===")
        
        for section in self._sections:
            content = section.render(state)
            if content:
                # Add Header
                blocks.append(f"\n--- {section.header} ---")
                # Add Content
                blocks.append(content)
        
        blocks.append("\n=========================================")
        return "\n".join(blocks)

# Global Singleton (or can be injected)
system_context = ContextPipeline()