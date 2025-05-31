from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import create_tables, SessionLocal
from app.core.notifications import init_notification_templates
from app.api.v1 import api_router

# Create FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json" if settings.DEBUG else None,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# Set up CORS with more explicit configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    """Root endpoint"""
    return {
        "message": "Help Desk Pro API",
        "version": settings.PROJECT_VERSION,
        "features": {
            "phase_1": "✅ Authentication, Users, Tickets",
            "phase_2": "✅ WebSocket, Chat, Notifications, File Uploads"
        },
        "docs_url": "/docs" if settings.DEBUG else None
    }

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": settings.PROJECT_VERSION
    }

# Create database tables and initialize data on startup
@app.on_event("startup")
async def startup_event():
    """Initialize application on startup"""
    print(f"🚀 Starting {settings.PROJECT_NAME} v{settings.PROJECT_VERSION}...")
    
    # Create database tables
    create_tables()
    print("✅ Database tables created")
    
    # Initialize notification templates
    db = SessionLocal()
    try:
        await init_notification_templates(db)
        print("✅ Notification templates initialized")
    except Exception as e:
        print(f"⚠️  Error initializing notification templates: {e}")
    finally:
        db.close()
    
    print(f"🎉 {settings.PROJECT_NAME} v{settings.PROJECT_VERSION} started successfully!")
    print(f"📚 API Documentation: http://localhost:8000/docs")
    print(f"🔗 WebSocket Endpoint: ws://localhost:8000/api/v1/ws")
    print(f"💬 Real-time Chat: Available")
    print(f"🔔 Live Notifications: Active")
    print(f"📁 File Uploads: Enabled")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    ) 