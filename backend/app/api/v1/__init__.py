from fastapi import APIRouter
from .auth import router as auth_router
from .users import router as users_router
from .tickets import router as tickets_router
from .websocket import router as websocket_router
from .chat import router as chat_router
from .notifications import router as notifications_router
from .files import router as files_router

api_router = APIRouter()

# Include all route modules
api_router.include_router(auth_router, prefix="/auth", tags=["authentication"])
api_router.include_router(users_router, prefix="/users", tags=["users"])
api_router.include_router(tickets_router, prefix="/tickets", tags=["tickets"])

# Phase 2: Real-time features
api_router.include_router(websocket_router, tags=["websocket"])
api_router.include_router(chat_router, prefix="/chat", tags=["chat"])
api_router.include_router(notifications_router, prefix="/notifications", tags=["notifications"])
api_router.include_router(files_router, prefix="/files", tags=["files"]) 