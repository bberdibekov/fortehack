# app/core/services/search_strategies.py
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, Tuple, List

class ISearchStrategy(ABC):
    @abstractmethod
    def find_item(self, data: Dict[str, Any], query: str) -> Tuple[Optional[Dict[str, Any]], Optional[List[Any]]]:
        """
        Traverses the artifact data to find an item matching the query.
        Returns: (The Item Dict, The Parent List it belongs to)
        """
        pass

class UserStorySearchStrategy(ISearchStrategy):
    def find_item(self, data: Dict, query: str):
        query = query.lower()
        stories = data.get('stories', [])
        for s in stories:
            # Flexible matching on Title or Action
            if query in s.get('title', '').lower() or query in s.get('i_want_to', '').lower():
                return s, stories
        return None, None

class UseCaseSearchStrategy(ISearchStrategy):
    def find_item(self, data: Dict, query: str):
        query = query.lower()
        cases = data.get('use_cases', [])
        for uc in cases:
            if query in uc.get('title', '').lower():
                return uc, cases
        return None, None

class WorkbookSearchStrategy(ISearchStrategy):
    def find_item(self, data: Dict, query: str):
        query = query.lower()
        # Workbook is nested: Categories -> Items
        categories = data.get('categories', [])
        for cat in categories:
            items = cat.get('items', [])
            for item in items:
                if query in item.get('text', '').lower():
                    return item, items 
        return None, None

class SearchStrategyFactory:
    _strategies = {
        "user_story": UserStorySearchStrategy(),
        "use_case": UseCaseSearchStrategy(),
        "workbook": WorkbookSearchStrategy()
    }

    @classmethod
    def get_strategy(cls, artifact_type: str) -> ISearchStrategy:
        # Returns None if type not supported (handled in Tool)
        return cls._strategies.get(artifact_type)