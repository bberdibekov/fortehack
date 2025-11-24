from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core.orchestrator import Orchestrator
from typing import Any

router = APIRouter()

@router.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await websocket.accept()
    
    # Callback to send data back to UI
    async def send_event(event_type: str, payload: Any):
        await websocket.send_json({"type": event_type, "payload": payload})

    # Initialize the Engine for this session
    engine = Orchestrator(session_id=client_id, emit=send_event)

    try:
        while True:
            data = await websocket.receive_json()
            # Assuming payload: { "type": "USER_MESSAGE", "content": "Hello" }
            if data.get("type") == "USER_MESSAGE":
                await engine.handle_user_message(data.get("content"))
            elif data.get("type") == "ARTIFACT_EDIT":
                # handle edit...
                pass
                
    except WebSocketDisconnect:
        print(f"Client {client_id} disconnected")