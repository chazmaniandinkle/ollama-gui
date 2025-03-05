from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.api.api_v1.api import api_router
from app.core.config import get_app_settings
from app.core.security import get_current_user
from app.db.session import create_db_and_tables
import socketio
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Socket.IO setup
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
socket_app = socketio.ASGIApp(sio)

# Lifespan events for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting application")
    settings = get_app_settings()
    
    # Initialize database
    await create_db_and_tables()
    
    # Start any background tasks
    logger.info("Application startup complete")
    
    yield
    
    # Shutdown
    logger.info("Shutting down application")
    # Clean up resources
    logger.info("Application shutdown complete")

# Create FastAPI app
def get_application() -> FastAPI:
    settings = get_app_settings()
    
    app = FastAPI(
        title="Ollama GUI API",
        description="API for Ollama GUI",
        version="1.0.0",
        lifespan=lifespan,
    )
    
    # Set up CORS
    origins = settings.cors_allow_origins
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Include API router
    app.include_router(api_router, prefix="/api")
    
    # Mount Socket.IO app
    app.mount("/ws", socket_app)
    
    @app.get("/health", tags=["health"])
    async def health_check():
        """
        Health check endpoint
        """
        return {"status": "ok", "version": "1.0.0"}
    
    return app

app = get_application()

# WebSocket event handlers
@sio.event
async def connect(sid, environ, auth):
    logger.info(f"Client connected: {sid}")

@sio.event
async def disconnect(sid):
    logger.info(f"Client disconnected: {sid}")

# Named Socket.IO events can be added here
@sio.event
async def chat_message(sid, data):
    # Example: Handle chat message event
    pass
