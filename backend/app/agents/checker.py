# app/agents/checker.py
from app.core.llm.interface import ILLMClient
from app.domain.models.state import SessionState
from app.domain.models.validation import ComplianceReport
from app.core.interfaces.policy_store import IPolicyStore

class CheckerAgent:
    def __init__(self, llm_client: ILLMClient, policy_store: IPolicyStore):
        self.llm = llm_client
        self.policy_store = policy_store

    async def audit(self, state: SessionState) -> ComplianceReport:
        # Optimization: Don't audit empty states
        if not state.actors and not state.process_steps:
             return ComplianceReport(issues=[], safety_score=100)

        # 1. RAG Step: Retrieve Relevant Policies
        # Construct a query based on the current context
        # We join descriptions to create a "bag of words" for the searcher
        query_parts = []
        if state.project_scope: query_parts.append(state.project_scope)
        if state.actors: query_parts.extend([a.role_name for a in state.actors])
        if state.process_steps: query_parts.extend([s.description for s in state.process_steps])
        
        query = " ".join(query_parts)
        
        # Fetch top 5 relevant policies
        relevant_policies = await self.policy_store.search(query, limit=5)
        
        # Format for the LLM
        policy_context_str = "\n".join([f"- [{p.category}] {p.text} (Source: {p.source})" for p in relevant_policies])

        # 2. Build Prompt
        context = f"""
        Project Scope: {state.project_scope}
        Business Goal: {state.goal.main_goal if state.goal else 'Undefined'}
        
        Actors:
        {', '.join([f"- {a.role_name}: {a.responsibilities}" for a in state.actors])}
        
        Process Steps:
        {', '.join([f"{s.step_id}. {s.actor} -> {s.description}" for s in state.process_steps])}
        """

        system_prompt = f"""
        You are a Senior Compliance Officer & QA Auditor for a Bank.
        Your job is to review the current business requirements and flag risks.

        REFERENCE POLICIES (Strictly Enforce These):
        {policy_context_str}

        INSTRUCTIONS:
        1. Analyze the Actors, Goal, and Process Steps.
        2. Identify violations of the Reference Policies listed above.
        3. Identify logical inconsistencies (e.g., steps that lead nowhere).
        4. Identify vague requirements (e.g., "Manager does stuff").
        5. Return a structured report. If everything looks good, return an empty list of issues and high score.
        """

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Here is the current requirements snapshot:\n{context}"}
        ]

        result = await self.llm.get_structured_completion(
            messages=messages,
            response_model=ComplianceReport,
        )
        
        return result