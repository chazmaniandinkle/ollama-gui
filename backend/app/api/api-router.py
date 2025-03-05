from fastapi import APIRouter
from app.api.api_v1.endpoints import auth, models, conversations, chat, documents, settings, tags

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(models.router, prefix="/models", tags=["models"])
api_router.include_router(conversations.router, prefix="/conversations", tags=["conversations"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"])
api_router.include_router(tags.router, prefix="/tags", tags=["tags"])
