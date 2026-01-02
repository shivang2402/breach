from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import os
import json
import threading
from app.orchestrator import Orchestrator

app = FastAPI()

# Enable CORS for Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Engine (assuming run from backend/ directory)
# Base dir is parent of backend/ or current dir?
# We will run uvicorn from 'backend/' so base_dir is '..'
BASE_DIR = os.path.abspath(os.path.join(os.getcwd(), ".."))
engine = Orchestrator(BASE_DIR)

# Mutex lock to prevent multiple fuzzer loops
fuzzer_lock = threading.Lock()

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        # Auto-stop fuzzer when last client disconnects
        if len(self.active_connections) == 0 and engine.is_running:
            engine.stop()

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass

manager = ConnectionManager()

# Hook Engine logs to WebSocket broadcast
def log_handler(entry):
    asyncio.create_task(manager.broadcast({"type": "log", "data": entry}))

engine.set_log_callback(log_handler)

@app.get("/")
def read_root():
    return {"status": "Red Team Fuzzer Backend is Running"}

@app.post("/start")
async def start_fuzzer():
    with fuzzer_lock:  # Mutex to prevent double-start
        if engine.is_running:
            return {"status": "Already running"}
        # Run loop in background
        asyncio.create_task(engine.start_loop())
        return {"status": "Started"}

@app.post("/stop")
def stop_fuzzer():
    engine.stop()
    return {"status": "Stopping..."}

@app.get("/status")
def get_status():
    return {"is_running": engine.is_running}

@app.get("/artifact/{name}")
def get_artifact(name: str):
    if name not in engine.files:
        return {"error": "Invalid artifact name"}
    content = engine.read_file(engine.files[name])
    return {"content": content}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Send history
        for msg in engine.messages:
             await websocket.send_json({"type": "log", "data": msg})
             
        while True:
            await websocket.receive_text() # Keep alive
    except WebSocketDisconnect:
        manager.disconnect(websocket)

