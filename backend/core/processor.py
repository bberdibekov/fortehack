# src/core/processor.py
import pandas as pd
from src.core.state_manager import StateManager
from src.ui.templates import TextTemplates
from src.core.classifier import IntentClassifier
from src.core.strategies.factory import ActionFactory
from src.core.domain.models import StrategyResult
from src.core.extraction.interface import IRequirementExtractor
from src.core.llm.interface import ILLMClient
from src.core.utils import run_async
from typing import Callable, Optional

class LogicProcessor:
    """
    Controller Layer.
    """

    def __init__(self, state_manager: StateManager, extractor: IRequirementExtractor, client: ILLMClient):
        self.state = state_manager
        self.extractor = extractor
        self.client = client
        self.factory = ActionFactory(client) # Inject Client into Factory

    # --- EXPLICIT COMMANDS ---

    def execute_reset(self):
        self.state.create_new_session()

    def execute_publish(self):
        pass

    # --- CONVERSATIONAL FLOW ---

    def process_user_input(self, user_input: str, status_callback: Optional[Callable[[str], None]] = None):
        """
        Main loop with dynamic status updates.
        status_callback: A function that accepts a string (e.g. "Extracting data...")
        """
        
        # Helper to safely call the callback
        def log_status(msg):
            if status_callback: 
                status_callback(msg)

        # 1. Log User Input
        self.state.add_user_message(user_input)
        
        # 2. EXTRACT
        log_status("📝 Extracting business requirements...")
        current_notebook = self.state.notebook
        updated_notebook = self.extractor.extract(current_notebook, user_input)
        self.state.update_notebook(updated_notebook)
        
        # 3. CLASSIFY
        log_status("🤔 Analyzing intent...")
        current_lang = self.state.language
        intent = IntentClassifier.classify(user_input, current_lang)
        
        # 4. STRATEGY
        if intent == "GENERATE_ARTIFACTS":
            log_status("🎨 Generating diagrams (this may take a moment)...")
        else:
            log_status("💬 Thinking...")
            
        action_strategy = self.factory.get_action(intent)
        
        # 5. EXECUTE
        result = run_async(action_strategy.execute(
            user_input, 
            current_lang, 
            self.state.notebook
        ))
        
        # 6. APPLY
        log_status("💾 Saving session...")
        self._apply_result(result)
        
        # 7. SAVE
        self.state.save_current_session()

    # --- INTERNAL HELPERS ---

    def _apply_result(self, result: StrategyResult):
        """
        Unpacks the StrategyResult DTO and updates the StateManager.
        """
        # 1. Update Chat Interface (Text Response)
        
        # LOGIC CHANGE: Determine if message_key is a Template Key or Generated Text
        # Heuristic: Keys are usually snake_case without spaces (e.g., "ask_goal").
        # Generated text has spaces and punctuation.
        if " " in result.message_key:
            response_text = result.message_key
        else:
            # Look up in templates
            response_text = TextTemplates.get(self.state.language, result.message_key)
            # If template missing, maybe it was a single word response? Just show it.
            if response_text.startswith("MISSING_"):
                response_text = result.message_key

        self.state.add_assistant_message(response_text)
        
        # 2. Update Diagram (if provided)
        if result.diagram_code:
            self.state.diagram_code = result.diagram_code
            
        # 3. Update Data Specifications (Legacy DataFrame support)
        if result.data_rows is not None:
            if len(result.data_rows) == 0 and result.diagram_code == "graph TD; Start --> End;":
                self.state.data_specs = pd.DataFrame(columns=["Field", "Type", "Source", "Validation"])
            elif len(result.data_rows) > 0:
                new_df = pd.DataFrame(result.data_rows)
                current_df = self.state.data_specs
                updated_df = pd.concat([current_df, new_df])
                updated_df = updated_df.drop_duplicates(subset=["Field"], keep='last')
                self.state.data_specs = updated_df

        # 4. Update Notebook
        if result.updated_notebook:
            self.state.update_notebook(result.updated_notebook)