# app/core/interfaces/policy_store.py
from abc import ABC, abstractmethod
from typing import List
from pydantic import BaseModel

class PolicyDocument(BaseModel):
    id: str
    category: str
    text: str
    source: str # e.g. "KYC_Manual_v2.pdf"

class IPolicyStore(ABC):
    @abstractmethod
    async def search(self, query: str, limit: int = 3) -> List[PolicyDocument]:
        """
        Semantically searches for policies relevant to the query.
        """
        pass
    
    @abstractmethod
    async def add_policy(self, policy: PolicyDocument):
        pass