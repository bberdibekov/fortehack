# This is the "Static Brain" - The Dependency Graph
# Key = The field in ShadowLedger that changed
# Value = The list of Artifact Types that must be regenerated
DEPENDENCY_GRAPH = {
    "actors": ["mermaid_diagram", "user_story"],
    "project_scope": ["mermaid_diagram"],
    "process_steps": ["mermaid_diagram", "kpi"],
    "goal": ["kpi"]
}