import os
import json
import logging
import markdown
import requests
from typing import Optional, List, Union, Dict, Any

from app.core.services.confluence_service.story_generator import generate_user_stories_html
from app.core.services.confluence_service.use_case_generator import generate_use_cases_html
from app.core.services.confluence_service.workbook_generator import generate_workbook_html
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ConfluenceService:
    def __init__(self, base_url: str, username: str, api_token: str):
        self.base_url = base_url.rstrip('/')
        self.auth = (username, api_token)
        self.headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }

  
    def create_page(self, space_key: str, title: str, html_body: str, parent_id: Optional[str] = None) -> dict:
        url = f"{self.base_url}/rest/api/content"
        payload = {
            "title": title, "type": "page", "space": {"key": space_key},
            "body": {"storage": {"value": html_body, "representation": "storage"}}
        }
        if parent_id: payload["ancestors"] = [{"id": parent_id}]
        response = requests.post(url, json=payload, auth=self.auth, headers=self.headers)
        if response.status_code == 200: return response.json()
        response.raise_for_status()

    def upload_attachment(self, content_id: str, filename: str, file_content: Union[bytes, str], content_type: str) -> dict:
        url = f"{self.base_url}/rest/api/content/{content_id}/child/attachment"
        headers = {"X-Atlassian-Token": "nocheck"}
        if isinstance(file_content, str): file_data = file_content.encode('utf-8')
        else: file_data = file_content
        files = {'file': (filename, file_data, content_type)}
        requests.post(url, headers=headers, auth=self.auth, files=files)

    def publish_analyst_report(
        self, 
        space_key: str, 
        page_title: str, 
        md_text: str, 
        json_data: dict, 
        svg_content: str, 
        stories: Optional[List[Dict[str, Any]]] = None,
        use_cases: Optional[List[Dict[str, Any]]] = None,
        workbook: Optional[Dict[str, Any]] = None,  # <--- NEW ARGUMENT
        parent_id: Optional[str] = None
    ):
        """
        Orchestration method to assemble all artifacts and publish.
        """
        
        # 1. Generate HTML Blocks
        html_intro = markdown.markdown(md_text)
        
        # Call Generators
        workbook_html = generate_workbook_html(workbook)
        stories_html = generate_user_stories_html(stories)
        use_cases_html = generate_use_cases_html(use_cases)

        # 2. Define Filenames
        svg_filename = "diagram_artifact.svg"
        json_filename = "data_artifact.json"

        # 3. Construct Confluence Storage Format
        storage_body = f"""
        {html_intro}
        
        {workbook_html}
        
        {stories_html}
        
        {use_cases_html}

        <h3>5. Generated Diagrams</h3>
        <p>
            <ac:image>
                <ri:attachment ri:filename="{svg_filename}" />
            </ac:image>
        </p>

        <h3>6. Data Artifacts</h3>
        <p>
            <ac:link>
                <ri:attachment ri:filename="{json_filename}" />
                <ac:plain-text-link-body><![CDATA[Download {json_filename}]]></ac:plain-text-link-body>
            </ac:link>
        </p>

        <h4>Data Preview</h4>
        <ac:structured-macro ac:name="code">
            <ac:parameter ac:name="language">json</ac:parameter>
            <ac:parameter ac:name="collapse">true</ac:parameter>
            <ac:plain-text-body><![CDATA[{json.dumps(json_data, indent=2)}]]></ac:plain-text-body>
        </ac:structured-macro>
        """

        # 4. Create Page
        try:
            page_data = self.create_page(space_key, page_title, storage_body, parent_id)
            page_id = page_data['id']

            # 5. Upload Artifacts
            self.upload_attachment(page_id, svg_filename, svg_content, "image/svg+xml")
            json_str = json.dumps(json_data, indent=2)
            self.upload_attachment(page_id, json_filename, json_str, "application/json")

            return page_data

        except Exception as e:
            logger.error(f"Error publishing analyst report: {str(e)}")
            raise