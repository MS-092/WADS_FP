from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from sqlalchemy.orm import Session
import json
import logging
from app.core.database import get_db, SessionLocal
from app.core.websocket import manager, handle_websocket_message
from app.core.dependencies import get_current_user
from app.core.auth import verify_token
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter()


async def get_websocket_user_after_accept(websocket: WebSocket, db: Session) -> User:
    """
    Authenticate WebSocket connection using token from query parameters
    (after connection is already accepted)
    """
    try:
        logger.info(f"WebSocket authentication attempt from {websocket.client}")
        
        # Get token from query parameters
        token = websocket.query_params.get("token")
        logger.info(f"Token received: {token[:20] if token else 'None'}...")
        
        if not token:
            logger.warning("WebSocket connection rejected: Missing authentication token")
            return None
        
        # Verify token
        user_id = verify_token(token, token_type="access")
        logger.info(f"Token verification result: user_id={user_id}")
        
        if user_id is None:
            logger.warning(f"WebSocket connection rejected: Invalid authentication token")
            return None
        
        # Get user from database
        user = db.query(User).filter(User.id == int(user_id)).first()
        logger.info(f"User lookup result: user={user.email if user else 'None'}, active={user.is_active if user else 'N/A'}")
        
        if not user or not user.is_active:
            logger.warning(f"WebSocket connection rejected: User not found or inactive")
            return None
        
        logger.info(f"WebSocket authentication successful for user {user.email}")
        return user
        
    except Exception as e:
        logger.error(f"WebSocket authentication error: {e}")
        return None


async def get_websocket_user(websocket: WebSocket, db: Session) -> User:
    """
    Authenticate WebSocket connection using token from query parameters
    """
    try:
        logger.info(f"WebSocket authentication attempt from {websocket.client}")
        
        # Get token from query parameters
        token = websocket.query_params.get("token")
        logger.info(f"Token received: {token[:20] if token else 'None'}...")
        
        if not token:
            logger.warning("WebSocket connection rejected: Missing authentication token")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Missing authentication token")
            return None
        
        # Verify token
        user_id = verify_token(token, token_type="access")
        logger.info(f"Token verification result: user_id={user_id}")
        
        if user_id is None:
            logger.warning(f"WebSocket connection rejected: Invalid authentication token")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid authentication token")
            return None
        
        # Get user from database
        user = db.query(User).filter(User.id == int(user_id)).first()
        logger.info(f"User lookup result: user={user.email if user else 'None'}, active={user.is_active if user else 'N/A'}")
        
        if not user or not user.is_active:
            logger.warning(f"WebSocket connection rejected: User not found or inactive")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="User not found or inactive")
            return None
        
        logger.info(f"WebSocket authentication successful for user {user.email}")
        return user
        
    except Exception as e:
        logger.error(f"WebSocket authentication error: {e}")
        await websocket.close(code=status.WS_1011_INTERNAL_ERROR, reason="Authentication failed")
        return None


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    Main WebSocket endpoint for real-time communication
    
    Usage:
    - Connect with: ws://localhost:8000/api/v1/ws?token=YOUR_ACCESS_TOKEN
    - Send JSON messages with different types for various actions
    """
    logger.info(f"WebSocket endpoint called from {websocket.client}")
    
    # Accept the WebSocket connection first
    await websocket.accept()
    logger.info("WebSocket connection accepted")
    
    # Get database session manually
    db = SessionLocal()
    
    try:
        # Now authenticate the user
        user = await get_websocket_user_after_accept(websocket, db)
        if not user:
            logger.warning("WebSocket endpoint: Authentication failed, closing connection")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Authentication failed")
            return
        
        logger.info(f"WebSocket endpoint: User {user.email} authenticated, connecting to manager")
        
        # Connect user to the manager
        await manager.connect(websocket, user.id)
        
        # Send welcome message
        await websocket.send_text(json.dumps({
            "type": "welcome",
            "message": f"Welcome {user.full_name}! You are now connected.",
            "user_id": user.id,
            "online_users": manager.get_online_users()
        }))
        
        # Listen for messages
        while True:
            try:
                # Receive message from WebSocket
                data = await websocket.receive_text()
                message_data = json.loads(data)
                
                # Handle the message
                await handle_websocket_message(websocket, user, message_data)
                
            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "Invalid JSON format"
                }))
            except Exception as e:
                logger.error(f"Error processing WebSocket message: {e}")
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "Failed to process message"
                }))
                
    except WebSocketDisconnect:
        # Handle disconnection
        await manager.disconnect(websocket, user.id)
        logger.info(f"User {user.id} disconnected from WebSocket")
        
    except Exception as e:
        logger.error(f"WebSocket error for user {user.id}: {e}")
        await manager.disconnect(websocket, user.id)
    finally:
        # Always close the database session
        db.close()


@router.get("/online-users")
async def get_online_users(current_user: User = Depends(get_current_user)):
    """
    Get list of currently online users
    """
    online_user_ids = manager.get_online_users()
    return {
        "online_users": online_user_ids,
        "count": len(online_user_ids)
    }


@router.post("/broadcast")
async def broadcast_message(
    message: str,
    current_user: User = Depends(get_current_user)
):
    """
    Broadcast a message to all connected users (Admin only)
    """
    if current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can broadcast messages"
        )
    
    broadcast_data = {
        "type": "broadcast",
        "message": message,
        "from": current_user.full_name,
        "priority": "high"
    }
    
    await manager.broadcast_to_all(broadcast_data)
    
    return {
        "message": "Broadcast sent successfully",
        "recipients": len(manager.get_online_users())
    }


@router.post("/notify-user/{user_id}")
async def send_notification_to_user(
    user_id: int,
    title: str,
    message: str,
    action_url: str = None,
    current_user: User = Depends(get_current_user)
):
    """
    Send a direct notification to a specific user
    """
    notification_data = {
        "title": title,
        "message": message,
        "action_url": action_url,
        "from": current_user.full_name,
        "type": "direct_message"
    }
    
    await manager.send_notification(user_id, notification_data)
    
    is_online = manager.is_user_online(user_id)
    
    return {
        "message": f"Notification sent to user {user_id}",
        "delivered_realtime": is_online
    } 