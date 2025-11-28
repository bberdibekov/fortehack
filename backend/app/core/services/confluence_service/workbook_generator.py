# app/core/services/confluence_service/workbook_generator.py
from typing import List, Dict, Any

def _get_category_icon(icon_key: str, title: str) -> str:
    """Helper to map icons based on the template logic."""
    # Ensure keys are strings to avoid NoneType errors
    key = (icon_key or "").lower()

        
    if key == 'target': return "🎯"
    if key == 'users': return "👥"
    if key == 'activity': return "📈"
    return "🔹"

  

def _generate_strategic_panel(category: Dict[str, Any]) -> str:
    """Generates a single panel for the Strategic Context section."""
    icon_val = category.get('icon') or ""
    title_val = category.get('title') or "Category"

        
    icon = _get_category_icon(icon_val, title_val)
    title = f"{icon} {title_val}"

    list_items = ""
    for item in category.get('items', []):
        text = item.get('text', '')
        
        # Bold keys logic (e.g. "Name: Value")
        if ':' in text:
            parts = text.split(':', 1)
            content = f"<strong>{parts[0]}:</strong>{parts[1]}"
        else:
            content = text
            
        list_items += f'<li style="margin-bottom: 6px; border-bottom: 1px dashed #eee; padding-bottom: 4px;">{content}</li>'

    return f"""
    <ac:structured-macro ac:name="panel">
        <ac:parameter ac:name="title">{title}</ac:parameter>
        <ac:parameter ac:name="borderStyle">solid</ac:parameter>
        <ac:rich-text-body>
            <ul style="list-style-type: none; padding-left: 0;">
                {list_items}
            </ul>
        </ac:rich-text-body>
    </ac:structured-macro>
    """

  

def generate_workbook_html(workbook_data: Dict[str, Any]) -> str:
    """
    Generates the Analyst Workbook Confluence Storage format.
    Expected data structure:
    {
    "categories": [...],
    "data_entities": [...],
    "nfrs": [...]
    }
    """
    if not workbook_data:
        return ""


        
    categories = workbook_data.get('categories', [])
    data_entities = workbook_data.get('data_entities', [])
    nfrs = workbook_data.get('nfrs', [])

    # =========================================================
    # SECTION 1: STRATEGIC ANALYSIS (2-Column Grid)
    # =========================================================

    # Filter non-process categories
    # FIX: Use (c.get('icon') or '') to safely handle None
    strat_cats = [
        c for c in categories 
        if 'process' not in (c.get('icon') or '') 
        and 'flow' not in (c.get('title') or '').lower()
    ]

    # Split into Left and Right columns
    mid_point = (len(strat_cats) + 1) // 2
    left_cats = strat_cats[:mid_point]
    right_cats = strat_cats[mid_point:]

    left_html = "".join([_generate_strategic_panel(c) for c in left_cats])
    right_html = "".join([_generate_strategic_panel(c) for c in right_cats])

    section_1 = f"""
    <h2>1. Strategic Context</h2>
    <ac:layout>
        <ac:layout-section ac:type="two_equal">
            <ac:layout-cell>{left_html}</ac:layout-cell>
            <ac:layout-cell>{right_html}</ac:layout-cell>
        </ac:layout-section>
    </ac:layout>
    <p>&nbsp;</p>
    """

# =========================================================
# SECTION 2: PROCESS FLOWS (Pill Visualization)
# =========================================================

    process_cats = [
        c for c in categories 
        if 'process' in (c.get('icon') or '') 
        or 'flow' in (c.get('title') or '').lower()
    ]
    process_html = ""

    for cat in process_cats:
        rows = ""
        for item in cat.get('items', []):
            raw_text = item.get('text', '')
            steps = raw_text.split('->')
            
            pills = ""
            for index, step in enumerate(steps):
                step_text = step.strip()
                
                # CSS Logic for Exceptions vs Normal
                if 'Exception' in step_text or 'Fail' in step_text:
                    style = "background-color: #FFEBE6; color: #DE350B; border-color: #FFBDAD;"
                else:
                    style = "background-color: #DEEBFF; color: #0052CC; border: 1px solid #B3D4FF;"
                
                pill_html = f"""
                <span style="display: inline-block; padding: 4px 10px; border-radius: 16px; font-size: 12px; 
                            font-weight: bold; {style}">
                    {step_text}
                </span>
                """
                
                arrow = '&nbsp;<span style="color:#999;">➤</span>&nbsp;' if index < len(steps) - 1 else ""
                pills += pill_html + arrow

            rows += f'<tr><td style="padding: 15px 0; border-bottom: 1px dashed #ccc;">{pills}</td></tr>'

        process_html += f"""
        <ac:structured-macro ac:name="panel">
            <ac:parameter ac:name="title">🔀 {cat.get('title', 'Process')}</ac:parameter>
            <ac:rich-text-body>
                <table style="width: 100%; border: none;">
                    <tbody>{rows}</tbody>
                </table>
            </ac:rich-text-body>
        </ac:structured-macro>
        """

    section_2 = f"<h2>2. Core Processes</h2>{process_html}<p>&nbsp;</p>" if process_html else ""

    # =========================================================
    # SECTION 3: DATA DICTIONARY
    # =========================================================

    data_html = ""
    if data_entities:
        rows = ""
        for entity in data_entities:
            fields_html = ""
            for field in entity.get('fields', []):
                fields_html += f"""
                <span style="display: inline-block; background-color: #F4F5F7; border: 1px solid #DFE1E6; 
                            border-radius: 3px; padding: 2px 5px; margin: 2px; font-family: monospace; 
                            font-size: 11px; color: #42526E;">
                    {field}
                </span>
                """
            
            rows += f"""
            <tr>
                <td><strong>{entity.get('name', '')}</strong></td>
                <td>{entity.get('description', '-')}</td>
                <td>{fields_html}</td>
            </tr>
            """

        data_html = f"""
        <h2>3. Data Dictionary</h2>
        <table>
            <thead>
                <tr>
                    <th style="width: 25%;">Entity Name</th>
                    <th>Description</th>
                    <th>Fields</th>
                </tr>
            </thead>
            <tbody>{rows}</tbody>
        </table>
        <p>&nbsp;</p>
        """

    # =========================================================
    # SECTION 4: NFRs
    # =========================================================

    nfr_html = ""
    if nfrs:
        rows = ""
        for nfr in nfrs:
            cat = nfr.get('category', 'General')
            
            # Status Color Logic
            color = "Grey"
            if 'Security' in cat: color = "Red"
            elif 'Performance' in cat: color = "Yellow"
            elif 'Reliability' in cat: color = "Blue"

            rows += f"""
            <tr>
                <td>
                    <ac:structured-macro ac:name="status">
                        <ac:parameter ac:name="title">{cat}</ac:parameter>
                        <ac:parameter ac:name="colour">{color}</ac:parameter>
                    </ac:structured-macro>
                </td>
                <td>{nfr.get('requirement', '')}</td>
            </tr>
            """

        nfr_html = f"""
        <h2>4. Non-Functional Requirements</h2>
        <table>
            <thead>
                <tr><th style="width: 150px;">Category</th><th>Requirement</th></tr>
            </thead>
            <tbody>{rows}</tbody>
        </table>
        """

    return f"<h1>📘 Analyst Workbook</h1>{section_1}{section_2}{data_html}{nfr_html}"