WORKBOOK_PROMPT = """
You are a Senior Business Analyst.
Update the Analyst Workbook based on the Project Context and the Current Draft.

{context_block}

=== CURRENT DRAFT (PREVIOUS VERSION) ===
{current_artifact_json}
========================================

INSTRUCTIONS:
1. **Categorize**: Group information into 'Business Goals', 'Scope & Actors', 'Process Flow', and 'KPIs'.
2. **Icons**: Assign these icons to categories: 'target' (Goals), 'users' (Actors), 'process' (Flows), 'activity' (KPIs).
3. **IDs**: Generate unique string IDs for every item and category.
4. **Preserve User Edits**: The CURRENT DRAFT contains manual edits (e.g., custom KPIs, specific notes). You MUST preserve these items unless they strictly contradict the new context.
5. **Merge**: Add new information from the Context (new goals, actors) into the appropriate categories.
7. **Icons**: Maintain existing icons. Assign 'target', 'users', 'process', 'activity' to new categories.

Return the fully merged JSON structure.
"""