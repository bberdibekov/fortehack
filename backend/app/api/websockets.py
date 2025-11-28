# app/api/websockets.py
import json
import uuid
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.core.orchestrator import Orchestrator
from app.state_container import session_repository

router = APIRouter()

@router.websocket("/ws/{client_id}")
async def websocket_endpoint(
    websocket: WebSocket, 
    client_id: str,
    session_id: Optional[str] = Query(None) 
):
    await websocket.accept()
    
    # 1. Determine Session Identity
    if session_id:
        # Resume existing session
        current_session_id = session_id
        is_new_session = False
        print(f"🔌 [WS] Client {client_id} resuming session: {current_session_id}")
    else:
        # Start new session
        current_session_id = str(uuid.uuid4())
        is_new_session = True
        print(f"🔌 [WS] Client {client_id} starting NEW session: {current_session_id}")

    # 2. Define the callback
    async def send_event(event_type: str, payload: dict):
        try:
            await websocket.send_json({"type": event_type, "payload": payload})
        except Exception as e:
            print(f"Error sending to client: {e}")

    # 3. Init Engine with the resolved Session ID
    engine = Orchestrator(
        session_id=current_session_id, 
        emit=send_event, 
        repository=session_repository
    )

    # 4. Handshake & Restore
    try:
        # We pass the flag so Orchestrator knows whether to emit SESSION_ESTABLISHED
        await engine.load_initial_state(is_new_session=is_new_session)
    except Exception as e:
        print(f"🔥 Failed to load initial state: {e}")
        # Optionally emit error to client here

    try:
        while True:
            try:
                raw_data = await websocket.receive_text()
                data = json.loads(raw_data)
                
            except json.JSONDecodeError:
                print("❌ Client sent invalid JSON. Ignoring.")
                continue

            event_type = data.get("type")
            payload = data.get("payload")

            if event_type == "USER_MESSAGE":
                try:
                    content = payload if isinstance(payload, str) else payload.get("content", "")
                    await engine.handle_user_message(content)
                except Exception as logic_error:
                    print(f"🔥 LOGIC CRASH: {logic_error}")
                    await send_event("ERROR", {"message": f"Server Logic Error: {str(logic_error)}"})
                    import traceback
                    traceback.print_exc()
                
            elif event_type == "ARTIFACT_EDIT":
                try:
                    p_doc_id = payload.get("id")
                    p_content = payload.get("content")
                    if p_doc_id and p_content:
                        await engine.handle_artifact_edit(p_doc_id, p_content)
                    else:
                        print("⚠️ Invalid ARTIFACT_EDIT payload structure")
                except Exception as e:
                    print(f"Error handling edit: {e}")

            elif event_type == "ARTIFACT_VISUAL_SYNC":
                try:
                    p_id = payload.get("id")
                    p_visual = payload.get("visual_data")
                    p_fmt = payload.get("format", "svg")
                    
                    if p_id and p_visual:
                        # Fire and forget (don't await strictly if performance matters, 
                        # but awaiting ensures state consistency)
                        await engine.handle_visual_sync(p_id, p_visual, p_fmt)
                    else:
                        print("⚠️ Invalid ARTIFACT_VISUAL_SYNC payload")
                except Exception as e:
                    print(f"Error handling visual sync: {e}")

            elif event_type == "PROJECT_PUBLISH":
                target = payload.get("target", "confluence")
                await engine.handle_publish(target)

    except WebSocketDisconnect:
        print(f"Client {client_id} disconnected from {current_session_id}")
    except Exception as e:
        print(f"Critical Error in Socket Loop: {e}")