WORKBOOK_PROMPT = """
You are a Senior Business Analyst.
Transform the provided Project Context into a structured Analyst Workbook.

{context_block}

INSTRUCTIONS:
1. **Categorize**: Group information into 'Business Goals', 'Scope & Actors', 'Process Flows', and 'KPIs'.
2. **Process Flows**: You MUST combine sequential process steps into single flow strings using ' -> ' syntax.
   - Example Input: "Step 1: Login", "Step 2: Check Balance"
   - Example Output: "Login -> Check Balance"
   - If a step involves a failure/rejection, append "(Exception)" to the text.
3. **Icons**: Assign these icons to categories: 'target' (Goals), 'users' (Actors), 'process' (Flows), 'activity' (KPIs).
4. **IDs**: Generate unique string IDs for every item and category.

Return strictly the JSON structure.
"""