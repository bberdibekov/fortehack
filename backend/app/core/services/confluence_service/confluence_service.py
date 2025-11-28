# app/core/services/confluence_service/confluence_service.py
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
logger = logging.getLogger()

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
        
        # Better Error logging
        logger.error(f"Create Page Failed: {response.status_code} - {response.text}")
        response.raise_for_status()

    def upload_attachment(self, content_id: str, filename: str, file_content: Union[bytes, str], content_type: str) -> dict:
        url = f"{self.base_url}/rest/api/content/{content_id}/child/attachment"
        headers = {"X-Atlassian-Token": "nocheck"}
        
        if isinstance(file_content, str): 
            file_data = file_content.encode('utf-8')
        else: 
            file_data = file_content
            
        files = {'file': (filename, file_data, content_type)}
        
        try:
            r = requests.post(url, headers=headers, auth=self.auth, files=files)
            if r.status_code not in [200, 201]:
                logger.warning(f"Attachment upload warning ({filename}): {r.status_code} - {r.text}")
        except Exception as e:
            logger.error(f"Attachment upload failed: {e}")

    def _sanitize_svg(self, svg_content: str) -> str:
        if not svg_content:
            return ""
        if "xmlns=" not in svg_content:
            return svg_content.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"')
        return svg_content

    def publish_analyst_report(
        self, 
        space_key: str, 
        page_title: str, 
        md_text: str, 
        json_data: dict, 
        svg_content: str, 
        stories: Optional[List[Dict[str, Any]]] = None,
        use_cases: Optional[List[Dict[str, Any]]] = None,
        workbook: Optional[Dict[str, Any]] = None,
        parent_id: Optional[str] = None
    ):
        # 1. Generate HTML Blocks
        html_intro = markdown.markdown(md_text)
        
        workbook_html = generate_workbook_html(workbook)
        stories_html = generate_user_stories_html(stories)
        use_cases_html = generate_use_cases_html(use_cases)

        # 2. Define Filenames
        svg_filename = "process_diagram.svg"
        json_filename = "data_artifact.json"
        md_filename = "requirements_brd.md"

        # 3. Construct Confluence Storage Format
        storage_body = f"""
        <p>
            <ac:structured-macro ac:name="toc">
                <ac:parameter ac:name="outline">true</ac:parameter>
            </ac:structured-macro>
        </p>

        {html_intro}
        
        {workbook_html}
        
        {stories_html}
        
        {use_cases_html}

        <h2>Visualizations</h2>
        <h3>Process Flow Diagram</h3>
        <p>
            <ac:image>
                <ri:attachment ri:filename="{svg_filename}" />
            </ac:image>
        </p>

        <h2>Downloads & Artifacts</h2>
        <table class="confluenceTable">
            <thead>
                <tr>
                    <th class="confluenceTh">Artifact</th>
                    <th class="confluenceTh">Format</th>
                    <th class="confluenceTh">Link</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="confluenceTd">Business Requirements Document</td>
                    <td class="confluenceTd">Markdown</td>
                    <td class="confluenceTd">
                        <ac:link>
                            <ri:attachment ri:filename="{md_filename}" />
                            <ac:plain-text-link-body><![CDATA[Download .md]]></ac:plain-text-link-body>
                        </ac:link>
                    </td>
                </tr>
                <tr>
                    <td class="confluenceTd">Structured Data</td>
                    <td class="confluenceTd">JSON</td>
                    <td class="confluenceTd">
                        <ac:link>
                            <ri:attachment ri:filename="{json_filename}" />
                            <ac:plain-text-link-body><![CDATA[Download .json]]></ac:plain-text-link-body>
                        </ac:link>
                    </td>
                </tr>
            </tbody>
        </table>

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
            clean_svg = self._sanitize_svg(svg_content)
            self.upload_attachment(page_id, svg_filename, clean_svg, "image/svg+xml")
            
            json_str = json.dumps(json_data, indent=2)
            self.upload_attachment(page_id, json_filename, json_str, "application/json")
            
            self.upload_attachment(page_id, md_filename, md_text, "text/markdown")

            return page_data

        except Exception as e:
            logger.error(f"Error publishing analyst report: {str(e)}")
            raise

  