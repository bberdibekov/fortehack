from typing import List, Dict, Any

def generate_user_stories_html(stories: List[Dict[str, Any]]) -> str:
    """
    Generates Confluence Storage Format for User Stories with Panels and Layouts.
    """
    if not stories:
        return ""

    html_output = "<h2>2. Detailed User Stories</h2>"

    for story in stories:
        # Safe Variable Extraction
        s_id = story.get('id', 'N/A')
        priority = story.get('priority', 'Medium')
        estimate = story.get('estimate', 'Unestimated')
        role = story.get('role', 'User')
        action = story.get('action', '...')
        benefit = story.get('benefit', '...')
        desc = story.get('description', '')

        # Build Lists
        ac_list = story.get('acceptanceCriteria', [])
        ac_html = "".join([f"<li>{item}</li>" for item in ac_list])
        if ac_html: ac_html = f"<ul>{ac_html}</ul>"
        else: ac_html = "<p><em>No acceptance criteria.</em></p>"

        scope_list = story.get('scope', [])
        in_scope_html = "".join([f"<li><span style='color: #006644;'>{item}</span></li>" for item in scope_list])
        if in_scope_html: in_scope_html = f"<p><strong>In Scope:</strong></p><ul>{in_scope_html}</ul>"

        out_scope_list = story.get('outOfScope', [])
        out_scope_html = "".join([f"<li><span style='color: #de350b;'>{item}</span></li>" for item in out_scope_list])
        if out_scope_html: out_scope_html = f"<p><strong>Out of Scope:</strong></p><ul>{out_scope_html}</ul>"

        desc_html = f'<p style="color: #6b778c; font-size: 12px;"><em>Context: {desc}</em></p>' if desc else ""

        # Construct HTML
        html_output += f"""
        <ac:structured-macro ac:name="panel">
            <ac:parameter ac:name="title">{s_id} | Priority: {priority} | Est: {estimate}</ac:parameter>
            <ac:parameter ac:name="borderStyle">solid</ac:parameter>
            <ac:rich-text-body>
                <div style="background-color: #f4f5f7; padding: 10px; border-radius: 4px; margin-bottom: 10px;">
                    <p><strong>As a</strong> <span style="color: #0052cc;">{role}</span>, 
                    <strong>I want to</strong> {action}, 
                    <strong>so that</strong> {benefit}.</p>
                    {desc_html}
                </div>
                <ac:layout>
                    <ac:layout-section ac:type="two_equal">
                        <ac:layout-cell>
                            <h4>✅ Acceptance Criteria</h4>
                            {ac_html}
                        </ac:layout-cell>
                        <ac:layout-cell>
                            <h4>🔭 Scope Definition</h4>
                            {in_scope_html}
                            {out_scope_html}
                        </ac:layout-cell>
                    </ac:layout-section>
                </ac:layout>
            </ac:rich-text-body>
        </ac:structured-macro>
        <p>&nbsp;</p>
        """
    return html_output