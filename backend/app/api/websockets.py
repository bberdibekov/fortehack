import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core.orchestrator import Orchestrator
from app.state_container import session_repository

router = APIRouter()

@router.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await websocket.accept()
    
    # 1. Define the callback
    async def send_event(event_type: str, payload: dict):
        # We wrap this in try/catch too, in case socket is dead
        try:
            await websocket.send_json({"type": event_type, "payload": payload})
        except Exception as e:
            print(f"Error sending to client: {e}")

    # 2. Init Engine
    engine = Orchestrator(session_id=client_id, emit=send_event, repository=session_repository)

    # Restore Session State immediately ---
    try:
        await engine.load_initial_state()
    except Exception as e:
        print(f"🔥 Failed to load initial state: {e}") 
    try:
        while True:
            # Use receive_text first, then parse manually. 
            try:
                raw_data = await websocket.receive_text()
                
                # Debug print to see exactly what client sent
                print(f"Received raw: {raw_data}") 
                
                data = json.loads(raw_data)
                
            except json.JSONDecodeError:
                print("❌ Client sent invalid JSON. Ignoring.")
                await websocket.send_json({"type": "ERROR", "payload": "Invalid JSON format. Please send {'type': '...', 'payload': '...'}"})
                continue

            # Process valid JSON
            event_type = data.get("type")
            payload = data.get("payload") # Should be the 'content' or dict

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
                # Handle edits
                try:
                    payload = data.get("payload", {})
                    doc_id = payload.get("id")
                    content = payload.get("content")
                    
                    if doc_id and content:
                        await engine.handle_artifact_edit(doc_id, content)
                    else:
                        print("⚠️ Invalid ARTIFACT_EDIT payload")
                except Exception as e:
                    print(f"Error handling edit: {e}")

    except WebSocketDisconnect:
        print(f"Client {client_id} disconnected")
    except Exception as e:
        print(f"Critical Error in Socket Loop: {e}")
        # Optionally close socket if critical
        # await websocket.close()