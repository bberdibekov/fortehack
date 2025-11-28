from typing import List, Dict, Any

def generate_use_cases_html(use_cases: List[Dict[str, Any]]) -> str:
    """
    Generates Confluence Storage Format for Functional Use Cases.
    """
    if not use_cases:
        return ""

    html_output = "<h2>3. Functional Use Cases</h2>"

    for uc in use_cases:
        # 1. Extract Basic Info
        uc_id = uc.get('id', 'UC-00')
        title = uc.get('title', 'Untitled')
        actor = uc.get('primary_actor', 'User')

        # 2. Build Lists (Pre/Post Conditions)
        pre_list = uc.get('preconditions', [])
        pre_html = "".join([f"<li>{item}</li>" for item in pre_list])
        if pre_html: pre_html = f"<ul>{pre_html}</ul>"
        else: pre_html = "<p><em>None</em></p>"

        post_list = uc.get('postconditions', [])
        post_html = "".join([f"<li>{item}</li>" for item in post_list])
        if post_html: post_html = f"<ul>{post_html}</ul>"
        else: post_html = "<p><em>None</em></p>"

        # 3. Build Main Flow Table Rows
        rows = ""
        main_flow = uc.get('main_flow', [])
        for step in main_flow:
            num = step.get('step_number', '#')
            action = step.get('action', '')
            alt_flow = step.get('alternative_flow', '')

            # Conditional Note Macro for Alternative Flow
            alt_flow_cell = ""
            if alt_flow:
                alt_flow_cell = f"""
                <ac:structured-macro ac:name="note">
                    <ac:rich-text-body>
                        <p>{alt_flow}</p>
                    </ac:rich-text-body>
                </ac:structured-macro>
                """

            rows += f"""
            <tr>
                <td class="confluenceTd" style="text-align: center;"><strong>{num}</strong></td>
                <td class="confluenceTd">{action}</td>
                <td class="confluenceTd">{alt_flow_cell}</td>
            </tr>
            """

        # 4. Construct the Panel
        html_output += f"""
        <ac:structured-macro ac:name="panel">
            <ac:parameter ac:name="title">{uc_id}: {title}</ac:parameter>
            <ac:parameter ac:name="borderStyle">solid</ac:parameter>
            <ac:rich-text-body>
                
                <p>
                    <strong>Primary Actor:</strong> 
                    <ac:structured-macro ac:name="status">
                        <ac:parameter ac:name="title">{actor}</ac:parameter>
                        <ac:parameter ac:name="colour">Blue</ac:parameter>
                    </ac:structured-macro>
                </p>

                <ac:layout>
                    <ac:layout-section ac:type="two_equal">
                        <ac:layout-cell>
                            <p><strong>▶️ Pre-Conditions</strong></p>
                            {pre_html}
                        </ac:layout-cell>
                        <ac:layout-cell>
                            <p><strong>✅ Post-Conditions</strong></p>
                            {post_html}
                        </ac:layout-cell>
                    </ac:layout-section>
                </ac:layout>

                <p>&nbsp;</p>

                <h4>📋 Main Flow</h4>
                <table class="confluenceTable">
                    <thead>
                        <tr>
                            <th class="confluenceTh" style="width: 40px; text-align: center;">#</th>
                            <th class="confluenceTh">Action</th>
                            <th class="confluenceTh" style="width: 30%;">Alternative Flow / Exception</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows}
                    </tbody>
                </table>

            </ac:rich-text-body>
        </ac:structured-macro>
        <p>&nbsp;</p>
        """

    return html_output