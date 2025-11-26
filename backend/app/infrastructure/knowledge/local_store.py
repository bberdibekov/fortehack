# app/infrastructure/knowledge/local_store.py
from typing import List
from app.core.interfaces.policy_store import IPolicyStore, PolicyDocument

class LocalPolicyStore(IPolicyStore):
    def __init__(self):
        self._documents: List[PolicyDocument] = []
        
        # Pre-seed with the existing hardcoded rules for backward compatibility
        self._seed_defaults()

    def _seed_defaults(self):
        defaults = [
            ("sep_duties", "Security", "The same person cannot initiate and approve a transaction.", "Global Policy"),
            ("auth", "Security", "All external actors (Customers) must use MFA.", "IT Sec Standard"),
            ("privacy", "Data", "No PII (Personally Identifiable Information) in clear text.", "GDPR"),
            ("specificity", "Quality", "Roles must be specific (e.g., 'Senior Risk Officer', not just 'Manager').", "BA Handbook"),
            ("flow", "Logic", "Process must have a clear success ending.", "BA Handbook"),
            ("loans", "Business", "Loan amounts over $1M require Risk Committee approval.", "Credit Policy"),
            ("audit", "Compliance", "All system changes must be logged in an immutable audit trail.", "IT Ops"),
        ]
        for pid, cat, text, src in defaults:
            self._documents.append(PolicyDocument(id=pid, category=cat, text=text, source=src))

    async def search(self, query: str, limit: int = 3) -> List[PolicyDocument]:
        """
        A naive search implementation. 
        """
        if not query:
            return self._documents[:limit]

        query_words = set(query.lower().split())
        
        # Score documents based on word overlap
        scored = []
        for doc in self._documents:
            score = 0
            doc_words = set(doc.text.lower().split())
            score = len(query_words.intersection(doc_words))
            
            # Boost if category is in query
            if doc.category.lower() in query.lower():
                score += 2
                
            scored.append((score, doc))
            
        # Sort by score desc
        scored.sort(key=lambda x: x[0], reverse=True)
        
        # Return top N (or all if query is empty/generic)
        results = [x[1] for x in scored if x[0] > 0]
        
        # Fallback: if no matches, return generic policies (Security/Quality)
        if not results:
             return self._documents[:limit]
             
        return results[:limit]

    async def add_policy(self, policy: PolicyDocument):
        self._documents.append(policy)