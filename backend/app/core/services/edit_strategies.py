# app/core/services/edit_strategies.py
from abc import ABC, abstractmethod
from typing import Any, Dict, List
import json
from app.domain.models.artifacts import WorkbookArtifact
from app.domain.models.state import SessionState, Persona, BusinessGoal

class IEditStrategy(ABC):
    @abstractmethod
    def validate_and_parse(self, raw_content: Any) -> Any:
        pass

    def apply_reverse_sync(self, state: SessionState, content: Any) -> None:
        pass

class MermaidEditStrategy(IEditStrategy):
    def validate_and_parse(self, raw_content: Any) -> Any:
        if isinstance(raw_content, str):
            return {"code": raw_content, "explanation": "User Edited"}
        
        code = raw_content.get("code")
        if not code:
            raise ValueError("Mermaid content missing 'code' field")
            
        return {"code": code, "explanation": raw_content.get("explanation", "User Edited")}

class UserStoryEditStrategy(IEditStrategy):
    def validate_and_parse(self, raw_content: Any) -> Any:
        if isinstance(raw_content, str):
            try:
                data = json.loads(raw_content)
            except json.JSONDecodeError:
                raise ValueError("Invalid JSON string")
        else:
            data = raw_content

        raw_list = data.get("stories", []) if isinstance(data, dict) else data
        if not isinstance(raw_list, list):
             raise ValueError("Stories must be a list")

        normalized_stories = []
        for item in raw_list:
            story = {
                "id": item.get("id") or item.get("id", "unknown"),
                "title": item.get("description") or item.get("title", ""),
                "as_a": item.get("role") or item.get("as_a", ""),
                "i_want_to": item.get("action") or item.get("i_want_to", ""),
                "so_that": item.get("benefit") or item.get("so_that", ""),
                "acceptance_criteria": item.get("acceptanceCriteria") or item.get("acceptance_criteria", []),
                "priority": item.get("priority", "Medium"),
                "estimate": item.get("estimate", "SP:?"),
                "scope": item.get("scope", []),
                "out_of_scope": item.get("outOfScope") or item.get("out_of_scope", [])
            }
            normalized_stories.append(story)

        return {"stories": normalized_stories}

    def apply_reverse_sync(self, state: SessionState, content: Any) -> None:
        data = content 
        stories = data.get("stories", [])
        
        if not stories:
            return

        found_role_names = set()
        for story in stories:
            role = story.get("as_a", "").strip()
            if role and len(role) > 2 and "role" not in role.lower():
                found_role_names.add(role)
        
        if not found_role_names:
            return

        existing_roles_map = {a.role_name.lower(): a for a in state.actors}
        changes_made = False
        for name in found_role_names:
            normalized = name.lower()
            if normalized not in existing_roles_map:
                new_actor = Persona(
                    role_name=name, 
                    responsibilities="Identified via User Story definition"
                )
                state.actors.append(new_actor)
                existing_roles_map[normalized] = new_actor
                changes_made = True
                
        if changes_made:
            print(f"🔄 UserStory Sync: Updated actors list based on story roles.")

class WorkbookEditStrategy(IEditStrategy):
    def validate_and_parse(self, raw_content: Any) -> Any:
        if isinstance(raw_content, str):
            try:
                data = json.loads(raw_content)
            except json.JSONDecodeError:
                raise ValueError("Invalid JSON string in Workbook edit")
        else:
            data = raw_content

        try:
            validated_model = WorkbookArtifact(**data)
            return validated_model.model_dump()
        except Exception as e:
             raise ValueError(f"Workbook validation failed: {str(e)}")

    def apply_reverse_sync(self, state: SessionState, content: Any) -> None:
        data = content
        categories = data.get("categories", [])
        
        for cat in categories:
            # FIX: Handle None values safely
            title = (cat.get("title") or "").lower()
            icon = (cat.get("icon") or "") 
            items = cat.get("items", []) or []
            
            # Extract text safely
            item_texts = []
            for i in items:
                txt = i.get("text")
                if txt:
                    item_texts.append(txt.strip())
            
            if not item_texts:
                continue

            # 1. Sync Scope
            if "scope" in title:
                state.project_scope = "; ".join(item_texts)
            
            # 2. Sync Goal
            # 'target' in icon ensures we capture the goal even if title varies
            elif "goal" in title or "target" in icon:
                main_goal = item_texts[0]
                metrics = item_texts[1:]
                
                state.goal = BusinessGoal(
                    main_goal=main_goal, 
                    success_metrics=metrics
                )
            
            # 3. Sync Actors
            elif "actor" in title or "users" in icon:
                existing_roles = {a.role_name.lower(): a for a in state.actors}
                new_actor_list = []
                
                for name in item_texts:
                    normalized_name = name.lower()
                    if normalized_name in existing_roles:
                        new_actor_list.append(existing_roles[normalized_name])
                    else:
                        new_actor_list.append(Persona(role_name=name))
                
                state.actors = new_actor_list

class EditStrategyFactory:
    _strategies = {
        "mermaid_diagram": MermaidEditStrategy(),
        "user_story": UserStoryEditStrategy(),
        "workbook": WorkbookEditStrategy()
    }

    @classmethod
    def get_strategy(cls, artifact_type: str) -> IEditStrategy:
        return cls._strategies.get(artifact_type, MermaidEditStrategy())