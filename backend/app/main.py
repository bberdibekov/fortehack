from fastapi import FastAPI
from app.api.websockets import router as websocket_router

app = FastAPI()


app.include_router(websocket_router)