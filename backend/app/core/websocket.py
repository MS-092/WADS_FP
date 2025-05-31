from typing import Dict, List, Set, Optional
from fastapi import WebSocket, WebSocketDisconnect
import json
import asyncio
from datetime import datetime
import logging
from app.models.user import User
from app.models.notification import NotificationType

logger = logging.getLogger(__name__)


class ConnectionManager:
    """
    WebSocket connection manager for real-time communication
    """
    
    def __init__(self):
        # Active connections by user_id
        self.active_connections: Dict[int, List[WebSocket]] = {}
        # Chat room subscriptions
        self.room_subscriptions: Dict[int, Set[int]] = {}  # room_id -> set of user_ids
        # User presence tracking
        self.user_presence: Dict[int, datetime] = {}
        
    async def connect(self, websocket: WebSocket, user_id: int):
        """Accept new WebSocket connection"""
        await websocket.accept()
        
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        
        self.active_connections[user_id].append(websocket)
        self.user_presence[user_id] = datetime.utcnow()
        
        logger.info(f"User {user_id} connected. Active connections: {len(self.active_connections)}")
        
        # Notify about user coming online
        await self.broadcast_user_status(user_id, "online")
    
    async def disconnect(self, websocket: WebSocket, user_id: int):
        """Remove WebSocket connection"""
        if user_id in self.active_connections:
            try:
                self.active_connections[user_id].remove(websocket)
                if not self.active_connections[user_id]:
                    del self.active_connections[user_id]
                    if user_id in self.user_presence:
                        del self.user_presence[user_id]
                    
                    # Notify about user going offline
                    await self.broadcast_user_status(user_id, "offline")
                    
            except ValueError:
                pass  # Connection already removed
        
        logger.info(f"User {user_id} disconnected. Active connections: {len(self.active_connections)}")
    
    async def send_personal_message(self, message: dict, user_id: int):
        """Send message to specific user"""
        if user_id in self.active_connections:
            disconnected = []
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_text(json.dumps(message))
                except Exception as e:
                    logger.error(f"Error sending message to user {user_id}: {e}")
                    disconnected.append(connection)
            
            # Remove disconnected connections
            for conn in disconnected:
                await self.disconnect(conn, user_id)
    
    async def send_to_room(self, message: dict, room_id: int, exclude_user: Optional[int] = None):
        """Send message to all users in a chat room"""
        if room_id in self.room_subscriptions:
            for user_id in self.room_subscriptions[room_id]:
                if exclude_user and user_id == exclude_user:
                    continue
                await self.send_personal_message(message, user_id)
    
    async def broadcast_to_all(self, message: dict):
        """Broadcast message to all connected users"""
        for user_id in list(self.active_connections.keys()):
            await self.send_personal_message(message, user_id)
    
    async def join_room(self, user_id: int, room_id: int):
        """Subscribe user to chat room"""
        if room_id not in self.room_subscriptions:
            self.room_subscriptions[room_id] = set()
        
        self.room_subscriptions[room_id].add(user_id)
        
        # Notify room about user joining
        await self.send_to_room({
            "type": "user_joined",
            "room_id": room_id,
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat()
        }, room_id, exclude_user=user_id)
    
    async def leave_room(self, user_id: int, room_id: int):
        """Unsubscribe user from chat room"""
        if room_id in self.room_subscriptions:
            self.room_subscriptions[room_id].discard(user_id)
            
            if not self.room_subscriptions[room_id]:
                del self.room_subscriptions[room_id]
            
            # Notify room about user leaving
            await self.send_to_room({
                "type": "user_left", 
                "room_id": room_id,
                "user_id": user_id,
                "timestamp": datetime.utcnow().isoformat()
            }, room_id)
    
    async def broadcast_user_status(self, user_id: int, status: str):
        """Broadcast user online/offline status"""
        message = {
            "type": "user_status",
            "user_id": user_id,
            "status": status,
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.broadcast_to_all(message)
    
    async def send_typing_indicator(self, room_id: int, user_id: int, is_typing: bool):
        """Send typing indicator to room"""
        message = {
            "type": "typing",
            "room_id": room_id,
            "user_id": user_id,
            "is_typing": is_typing,
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.send_to_room(message, room_id, exclude_user=user_id)
    
    async def send_notification(self, user_id: int, notification_data: dict):
        """Send real-time notification to user"""
        message = {
            "type": "notification",
            "data": notification_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.send_personal_message(message, user_id)
    
    async def send_chat_message(self, room_id: int, message_data: dict, sender_id: int):
        """Send chat message to room"""
        message = {
            "type": "chat_message",
            "room_id": room_id,
            "data": message_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.send_to_room(message, room_id, exclude_user=sender_id)
    
    async def send_ticket_update(self, ticket_id: int, update_data: dict, exclude_user: Optional[int] = None):
        """Send ticket update notification"""
        message = {
            "type": "ticket_update",
            "ticket_id": ticket_id,
            "data": update_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Send to all agents and admins, plus the ticket owner
        # This would typically query the database to get relevant users
        # For now, we'll broadcast to all active users
        for user_id in list(self.active_connections.keys()):
            if exclude_user and user_id == exclude_user:
                continue
            await self.send_personal_message(message, user_id)
    
    def get_online_users(self) -> List[int]:
        """Get list of currently online user IDs"""
        return list(self.active_connections.keys())
    
    def is_user_online(self, user_id: int) -> bool:
        """Check if user is currently online"""
        return user_id in self.active_connections
    
    def get_room_participants(self, room_id: int) -> Set[int]:
        """Get participants in a chat room"""
        return self.room_subscriptions.get(room_id, set())


# Global connection manager instance
manager = ConnectionManager()


async def handle_websocket_message(websocket: WebSocket, user: User, message_data: dict):
    """
    Handle incoming WebSocket messages
    """
    message_type = message_data.get("type")
    
    try:
        if message_type == "ping":
            # Heartbeat/keepalive
            await websocket.send_text(json.dumps({"type": "pong"}))
            
        elif message_type == "join_room":
            room_id = message_data.get("room_id")
            if room_id:
                await manager.join_room(user.id, room_id)
                
        elif message_type == "leave_room":
            room_id = message_data.get("room_id")
            if room_id:
                await manager.leave_room(user.id, room_id)
                
        elif message_type == "typing":
            room_id = message_data.get("room_id")
            is_typing = message_data.get("is_typing", False)
            if room_id:
                await manager.send_typing_indicator(room_id, user.id, is_typing)
                
        elif message_type == "mark_notification_read":
            notification_id = message_data.get("notification_id")
            # This would typically update the database
            # and send confirmation back to the user
            
        else:
            logger.warning(f"Unknown message type: {message_type}")
            
    except Exception as e:
        logger.error(f"Error handling WebSocket message: {e}")
        await websocket.send_text(json.dumps({
            "type": "error",
            "message": "Failed to process message"
        })) 