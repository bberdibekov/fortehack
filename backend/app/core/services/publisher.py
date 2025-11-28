# app/core/services/publisher.py
import asyncio
import json
import logging
import datetime
import inspect
from typing import Optional, Dict, Any, List

from app.config.settings import AppConfig
from app.domain.models.state import SessionState
from app.core.services.markdown_generator import MarkdownGenerator
from app.core.services.confluence_service.confluence_service import ConfluenceService
from app.utils.logger import setup_logger

logger = setup_logger("PublishService")

class PublishService:
    """
    Acts as an Adapter between the Domain (SessionState) and the Infrastructure (ConfluenceService).
    """
        
    def __init__(self):
        self.md_generator = MarkdownGenerator()
        self.confluence: Optional[ConfluenceService] = None
        self._init_client()

    def _init_client(self):
        """Initialize the Confluence Client if credentials exist."""
        
        url = getattr(AppConfig, "CONFLUENCE_URL", None)
        user = getattr(AppConfig, "CONFLUENCE_USER_NAME", None)
        token = getattr(AppConfig, "CONFLUENCE_API_TOKEN", None)
        
        masked_token = f"{str(token)[:4]}...***" if token else "None"
        logger.info(f"🔍 Debug Config Check - URL: {url}, User: {user}, Token: {masked_token}")

        try:
            sig = inspect.signature(ConfluenceService.__init__)
            logger.info(f"🔍 ConfluenceService.__init__ signature: {sig}")
        except Exception as sig_err:
            logger.error(f"Could not inspect signature: {sig_err}")

        if url and user and token:
            try:
                self.confluence = ConfluenceService(
                    base_url=url,
                    username=user,
                    api_token=token
                )
                logger.info("✅ Confluence Client Initialized")
            except Exception as e:
                logger.error(f"❌ Failed to init Confluence Client: {e}")
                # Important: Print the mro to see where the class is coming from
                logger.error(f"Debug MRO: {ConfluenceService.mro()}")
        else:
            logger.warning("⚠️ Confluence credentials missing in AppConfig. Publishing will fail.")

    async def publish(self, state: SessionState, target: str) -> str:
        """
        Orchestrates the publishing workflow.
        Returns the URL of the created page.
        """
        # Re-check initialization just in case config loaded late
        if not self.confluence:
            logger.info("🔄 Attempting lazy re-initialization of Confluence Client...")
            self._init_client()

        if not self.confluence:
            msg = (
                "Confluence credentials are not configured or Init Failed. "
                f"URL={AppConfig.CONFLUENCE_URL}, User={AppConfig.CONFLUENCE_USER_NAME}"
            )
            logger.error(f"🔥 {msg}")
            raise ValueError(msg)

        if target.lower() != "confluence":
            raise ValueError(f"Unsupported target: {target}")

        logger.info(f"🚀 Starting Publish Workflow for Session: {state.session_id}")

        # 1. Prepare Data (CPU Bound - Run Synchronously)
        try:
            # A. Executive Summary (Markdown)
            md_summary = self.md_generator.generate(state)
            
            # B. Artifact Extraction & Mapping
            stories_data = self._extract_and_map_stories(state)
            use_cases_data = self._extract_and_map_use_cases(state)
            workbook_data = self._extract_workbook(state)
            
            # C. Visuals (SVG)
            svg_content = self._extract_visual(state, "mermaid_diagram")
            if not svg_content:
                svg_content = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 50"><text y="20" font-family="Arial">No Diagram Generated</text></svg>'
                logger.warning("⚠️ No SVG found for 'mermaid_diagram'. Using placeholder.")

            # D. Raw Data for JSON Attachment
            raw_export_data = {
                "session_id": state.session_id,
                "scope": state.project_scope,
                "actors": [a.model_dump() for a in state.actors],
                "stories_count": len(stories_data) if stories_data else 0,
                "generated_at": datetime.datetime.now().isoformat()
            }

            base_title = "Business Requirements"
            if state.goal and state.goal.main_goal:
                base_title = state.goal.main_goal[:40].strip() + "..."
            
            timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
            page_title = f"{base_title} ({timestamp})"
            
            space_key = "PM" 

        except Exception as e:
            logger.error(f"🔥 Data Preparation Failed: {e}")
            raise e

        # 2. Execute I/O (Blocking - Run in Thread)
        logger.info(f"📤 Uploading to Confluence Space='{space_key}', Title='{page_title}'...")
        
        try:
            result = await asyncio.to_thread(
                self.confluence.publish_analyst_report,
                space_key=space_key,
                page_title=page_title,
                md_text=md_summary,
                json_data=raw_export_data,
                svg_content=svg_content,
                stories=stories_data,
                use_cases=use_cases_data,
                workbook=workbook_data
            )
            
            base = result.get('_links', {}).get('base', '')
            webui = result.get('_links', {}).get('webui', '')
            full_url = f"{base}{webui}"
            
            logger.info(f"✅ Published Successfully: {full_url}")
            return full_url

        except Exception as e:
            logger.error(f"❌ Confluence API Error: {e}")
            raise RuntimeError(f"Confluence Upload Failed: {str(e)}")

    # --- HELPER: Extraction & Mapping ---

    def _extract_and_map_stories(self, state: SessionState) -> List[Dict[str, Any]]:
        version = state.artifact_counters.get("user_story", 0)
        if version == 0:
            return []
        
        internal_id = f"user_story-v{version}"
        raw_data = state.artifacts.get(internal_id)
        
        if not raw_data or "stories" not in raw_data:
            return []

        mapped_stories = []
        for s in raw_data["stories"]:
            mapped_s = {
                "id": s.get("id"),
                "priority": s.get("priority"),
                "estimate": s.get("estimate"),
                "role": s.get("as_a"),           
                "action": s.get("i_want_to"),    
                "benefit": s.get("so_that"),     
                "description": s.get("title", ""), 
                "acceptanceCriteria": s.get("acceptance_criteria", []),
                "scope": s.get("scope", []),
                "outOfScope": s.get("out_of_scope", []) 
            }
            mapped_stories.append(mapped_s)
            
        logger.debug(f"   - Mapped {len(mapped_stories)} User Stories")
        return mapped_stories

    def _extract_and_map_use_cases(self, state: SessionState) -> List[Dict[str, Any]]:
        version = state.artifact_counters.get("use_case", 0)
        if version == 0:
            return []
        
        internal_id = f"use_case-v{version}"
        raw_data = state.artifacts.get(internal_id)
        
        if not raw_data or "use_cases" not in raw_data:
            return []
            
        return raw_data["use_cases"]

    def _extract_workbook(self, state: SessionState) -> Optional[Dict[str, Any]]:
        version = state.artifact_counters.get("workbook", 0)
        if version == 0:
            return None
        
        internal_id = f"workbook-v{version}"
        return state.artifacts.get(internal_id)

    def _extract_visual(self, state: SessionState, artifact_type: str) -> Optional[str]:
        version = state.artifact_counters.get(artifact_type, 0)
        if version == 0:
            return None
            
        internal_id = f"{artifact_type}-v{version}"
        svg_data = state.visual_artifacts.get(internal_id)
        
        if svg_data:
            logger.debug(f"   - Found Visual Artifact {internal_id} ({len(svg_data)} chars)")
        
        return svg_data