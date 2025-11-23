# src\core\extraction\implementations.py
from src.core.extraction.interface import IRequirementExtractor
from src.core.domain.models import AnalystNotebook, ExtractionSlot

class MockRequirementExtractor(IRequirementExtractor):
    """
    Deterministic extractor for testing logic without API costs.
    """
    def extract(self, current_state: AnalystNotebook, user_input: str) -> AnalystNotebook:
        # Create a deep copy to avoid mutating the state directly
        new_state = current_state.model_copy(deep=True)

            
        text = user_input.lower()
            
        # 1. Mock Actor Extraction
        if "manager" in text or "gestor" in text:
            # Avoid duplicates
            if not any(a.value == "Risk Manager" for a in new_state.actors):
                new_state.actors.append(ExtractionSlot(
                    value="Risk Manager", 
                    source="USER", 
                    confidence=1.0
                ))
        
        # 2. Mock Goal Extraction
        if "loan" in text or "préstamo" in text:
            if not new_state.goal:
                new_state.goal = ExtractionSlot(
                    value="Automate Personal Loan Processing",
                    source="INFERRED",
                    confidence=0.8
                )
            
        # 3. Mock KPI Extraction (Inferred)
        if "fast" in text or "rápido" in text:
            new_state.kpis.append(ExtractionSlot(
                value="Process Time < 5 mins",
                source="INFERRED",
                confidence=0.6
            ))
            
        return new_state