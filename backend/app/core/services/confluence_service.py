import os
import json
import logging
import markdown
import requests
from typing import Optional, List, Union

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ConfluenceService:
    def __init__(self, base_url: str, username: str, api_token: str):
        """
        Initialize the Confluence Service.
        
        :param base_url: e.g., "https://your-domain.atlassian.net/wiki"
        :param username  //email
        :param api_token
        """
        self.base_url = base_url.rstrip('/')
        self.auth = (username, api_token)
        self.headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }

    def create_page(self, space_key: str, title: str, html_body: str, parent_id: Optional[str] = None) -> dict:
        """
        Creates a new page in Confluence.
        API Ref: POST /rest/content
        """
        url = f"{self.base_url}/rest/api/content"
        
        payload = {
            "title": title,
            "type": "page",
            "space": {"key": space_key},
            "body": {
                "storage": {
                    "value": html_body,
                    "representation": "storage"
                }
            }
        }

        if parent_id:
            payload["ancestors"] = [{"id": parent_id}]

        response = requests.post(url, json=payload, auth=self.auth, headers=self.headers)
        
        if response.status_code == 200:
            logger.info(f"Page '{title}' created successfully.")
            return response.json()
        else:
            logger.error(f"Failed to create page: {response.text}")
            response.raise_for_status()

    def upload_attachment(self, content_id: str, filename: str, file_content: Union[bytes, str], content_type: str) -> dict:
        """
        Uploads an attachment to a specific page (content_id).
        API Ref: POST /rest/content/{id}/child/attachment
        """
        url = f"{self.base_url}/rest/api/content/{content_id}/child/attachment"
        
        # Confluence requires this specific header for attachments to prevent XSRF
        headers = {
            "X-Atlassian-Token": "nocheck"
        }

        # Handle string content (like JSON or SVG string) vs actual bytes
        if isinstance(file_content, str):
            file_data = file_content.encode('utf-8')
        else:
            file_data = file_content

        files = {
            'file': (filename, file_data, content_type)
        }

        # Note: requests handles Content-Type multipart/form-data automatically when 'files' is passed
        response = requests.post(url, headers=headers, auth=self.auth, files=files)

        if response.status_code == 200:
            logger.info(f"Attachment '{filename}' uploaded successfully.")
            return response.json()
        else:
            logger.error(f"Failed to upload attachment: {response.text}")
            response.raise_for_status()

    def publish_analyst_report(self, space_key: str, page_title: str, md_text: str, json_data: dict, svg_content: str, parent_id: Optional[str] = None):
        """
        High-level workflow to:
        1. Generate HTML body from Markdown.
        2. Embed references to the SVG and JSON files (that haven't been uploaded yet).
        3. Create the Page.
        4. Upload the actual JSON and SVG artifacts.
        """
        
        # 1. Convert Markdown to HTML
        html_content = markdown.markdown(md_text)

        # 2. Define Filenames
        svg_filename = "diagram_artifact.svg"
        json_filename = "data_artifact.json"

        # 3. Construct Confluence Storage Format (XHTML)
        # We construct the body *referencing* the attachments before we actually upload them.
        # This prevents needing to Update the page content a second time.
        
        storage_body = f"""
        {html_content}
        
        <h3>Generated Diagrams</h3>
        <p>
            <ac:image>
                <ri:attachment ri:filename="{svg_filename}" />
            </ac:image>
        </p>

        <h3>Data Artifacts</h3>
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

        # 4. Create the Page
        try:
            page_data = self.create_page(space_key, page_title, storage_body, parent_id)
            page_id = page_data['id']

            # 5. Upload Artifacts
            # Upload SVG
            self.upload_attachment(page_id, svg_filename, svg_content, "image/svg+xml")
            
            # Upload JSON
            json_str = json.dumps(json_data, indent=2)
            self.upload_attachment(page_id, json_filename, json_str, "application/json")

            return page_data

        except Exception as e:
            logger.error(f"Error publishing analyst report: {str(e)}")
            raise