from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_agent_or_admin_user
from app.core.websocket import manager
from app.core.files import file_service, get_file_category
from app.models.user import User, UserRole
from app.models.chat import ChatRoom, ChatMessage, ChatParticipant, ChatRoomType, MessageType
from app.models.ticket import Ticket
from app.schemas.chat import (
    ChatRoomCreate, ChatRoomResponse, ChatRoomSummary,
    ChatMessageCreate, ChatMessageResponse, ChatMessageUpdate,
    ChatRoomInvite, ChatTypingEvent
)

router = APIRouter()


@router.get("/rooms", response_model=List[ChatRoomSummary])
def list_chat_rooms(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    room_type: Optional[ChatRoomType] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user's chat rooms
    """
    query = db.query(ChatRoom).join(ChatParticipant).filter(
        ChatParticipant.user_id == current_user.id,
        ChatParticipant.is_active == True,
        ChatRoom.is_active == True
    )
    
    if room_type:
        query = query.filter(ChatRoom.type == room_type)
    
    rooms = query.order_by(ChatRoom.last_message_at.desc().nullslast()).offset(skip).limit(limit).all()
    
    # Convert to summary with additional info
    room_summaries = []
    for room in rooms:
        participant_count = db.query(ChatParticipant).filter(
            ChatParticipant.room_id == room.id,
            ChatParticipant.is_active == True
        ).count()
        
        # Get last message preview
        last_message = db.query(ChatMessage).filter(
            ChatMessage.room_id == room.id,
            ChatMessage.is_deleted == False
        ).order_by(ChatMessage.created_at.desc()).first()
        
        last_message_preview = None
        if last_message:
            if last_message.message_type == MessageType.TEXT:
                last_message_preview = last_message.content[:50] + "..." if len(last_message.content) > 50 else last_message.content
            elif last_message.message_type == MessageType.FILE:
                last_message_preview = f"📎 {last_message.file_name}"
            elif last_message.message_type == MessageType.IMAGE:
                last_message_preview = "🖼️ Image"
        
        room_summary = ChatRoomSummary(
            id=room.id,
            name=room.name,
            type=room.type,
            is_active=room.is_active,
            ticket_id=room.ticket_id,
            participant_count=participant_count,
            unread_count=0,  # TODO: Implement unread count
            last_message_at=room.last_message_at,
            last_message_preview=last_message_preview
        )
        room_summaries.append(room_summary)
    
    return room_summaries


@router.post("/rooms", response_model=ChatRoomResponse, status_code=status.HTTP_201_CREATED)
def create_chat_room(
    room_data: ChatRoomCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new chat room
    """
    # Validate ticket if provided
    if room_data.ticket_id:
        ticket = db.query(Ticket).filter(Ticket.id == room_data.ticket_id).first()
        if not ticket:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ticket not found"
            )
        
        # Check if user has access to the ticket
        if (current_user.role == UserRole.CUSTOMER and ticket.user_id != current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to create chat for this ticket"
            )
    
    # Create chat room
    chat_room = ChatRoom(
        name=room_data.name,
        type=room_data.type,
        ticket_id=room_data.ticket_id,
        created_by=current_user.id
    )
    
    db.add(chat_room)
    db.commit()
    db.refresh(chat_room)
    
    # Add creator as participant
    creator_participant = ChatParticipant(
        room_id=chat_room.id,
        user_id=current_user.id
    )
    db.add(creator_participant)
    
    # Add other participants
    for user_id in room_data.participant_ids:
        if user_id != current_user.id:  # Don't add creator twice
            participant = ChatParticipant(
                room_id=chat_room.id,
                user_id=user_id
            )
            db.add(participant)
    
    db.commit()
    
    # Load room with relationships for response
    chat_room = db.query(ChatRoom).options(
        joinedload(ChatRoom.creator),
        joinedload(ChatRoom.participants).joinedload(ChatParticipant.user)
    ).filter(ChatRoom.id == chat_room.id).first()
    
    return chat_room


@router.get("/rooms/{room_id}", response_model=ChatRoomResponse)
def get_chat_room(
    room_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get chat room details
    """
    # Check if user is participant
    participant = db.query(ChatParticipant).filter(
        ChatParticipant.room_id == room_id,
        ChatParticipant.user_id == current_user.id,
        ChatParticipant.is_active == True
    ).first()
    
    if not participant:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this chat room"
        )
    
    room = db.query(ChatRoom).options(
        joinedload(ChatRoom.creator),
        joinedload(ChatRoom.participants).joinedload(ChatParticipant.user)
    ).filter(ChatRoom.id == room_id).first()
    
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat room not found"
        )
    
    return room


@router.post("/rooms/{room_id}/messages", response_model=ChatMessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    room_id: int,
    message_data: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Send a message to chat room
    """
    # Check if user is participant
    participant = db.query(ChatParticipant).filter(
        ChatParticipant.room_id == room_id,
        ChatParticipant.user_id == current_user.id,
        ChatParticipant.is_active == True
    ).first()
    
    if not participant:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to send messages to this room"
        )
    
    # Create message
    message = ChatMessage(
        content=message_data.content,
        message_type=message_data.message_type,
        room_id=room_id,
        user_id=current_user.id,
        reply_to_id=message_data.reply_to_id
    )
    
    db.add(message)
    
    # Update room's last message timestamp
    room = db.query(ChatRoom).filter(ChatRoom.id == room_id).first()
    room.last_message_at = datetime.utcnow()
    
    db.commit()
    db.refresh(message)
    
    # Load message with relationships
    message = db.query(ChatMessage).options(
        joinedload(ChatMessage.user)
    ).filter(ChatMessage.id == message.id).first()
    
    # Send real-time message to room participants
    message_data_dict = {
        "id": message.id,
        "content": message.content,
        "message_type": message.message_type.value,
        "user": {
            "id": message.user.id,
            "first_name": message.user.first_name,
            "last_name": message.user.last_name,
            "email": message.user.email,
            "role": message.user.role.value
        },
        "created_at": message.created_at.isoformat(),
        "reply_to_id": message.reply_to_id
    }
    
    await manager.send_chat_message(room_id, message_data_dict, current_user.id)
    
    return message


@router.post("/rooms/{room_id}/messages/file", response_model=ChatMessageResponse, status_code=status.HTTP_201_CREATED)
async def send_file_message(
    room_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Send a file message to chat room
    """
    # Check if user is participant
    participant = db.query(ChatParticipant).filter(
        ChatParticipant.room_id == room_id,
        ChatParticipant.user_id == current_user.id,
        ChatParticipant.is_active == True
    ).first()
    
    if not participant:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to send files to this room"
        )
    
    # Save file
    file_info = await file_service.save_chat_file(file)
    
    # Determine message type based on file
    message_type = MessageType.IMAGE if file_info["content_type"].startswith("image/") else MessageType.FILE
    
    # Create message
    message = ChatMessage(
        content=f"Shared {file_info['original_filename']}",
        message_type=message_type,
        room_id=room_id,
        user_id=current_user.id,
        file_url=file_info["url"],
        file_name=file_info["original_filename"],
        file_size=file_info["size"]
    )
    
    db.add(message)
    
    # Update room's last message timestamp
    room = db.query(ChatRoom).filter(ChatRoom.id == room_id).first()
    room.last_message_at = datetime.utcnow()
    
    db.commit()
    db.refresh(message)
    
    # Load message with relationships
    message = db.query(ChatMessage).options(
        joinedload(ChatMessage.user)
    ).filter(ChatMessage.id == message.id).first()
    
    # Send real-time message to room participants
    message_data_dict = {
        "id": message.id,
        "content": message.content,
        "message_type": message.message_type.value,
        "file_url": message.file_url,
        "file_name": message.file_name,
        "file_size": message.file_size,
        "user": {
            "id": message.user.id,
            "first_name": message.user.first_name,
            "last_name": message.user.last_name,
            "email": message.user.email,
            "role": message.user.role.value
        },
        "created_at": message.created_at.isoformat()
    }
    
    await manager.send_chat_message(room_id, message_data_dict, current_user.id)
    
    return message


@router.get("/rooms/{room_id}/messages", response_model=List[ChatMessageResponse])
def get_room_messages(
    room_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get messages from chat room
    """
    # Check if user is participant
    participant = db.query(ChatParticipant).filter(
        ChatParticipant.room_id == room_id,
        ChatParticipant.user_id == current_user.id,
        ChatParticipant.is_active == True
    ).first()
    
    if not participant:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view messages in this room"
        )
    
    messages = db.query(ChatMessage).options(
        joinedload(ChatMessage.user)
    ).filter(
        ChatMessage.room_id == room_id,
        ChatMessage.is_deleted == False
    ).order_by(ChatMessage.created_at.desc()).offset(skip).limit(limit).all()
    
    # Reverse to get chronological order
    messages.reverse()
    
    return messages


@router.put("/messages/{message_id}", response_model=ChatMessageResponse)
async def update_message(
    message_id: int,
    message_update: ChatMessageUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update/edit a chat message (only by the sender)
    """
    message = db.query(ChatMessage).filter(
        ChatMessage.id == message_id,
        ChatMessage.user_id == current_user.id,
        ChatMessage.is_deleted == False
    ).first()
    
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found or not authorized to edit"
        )
    
    # Update message
    if message_update.content is not None:
        message.content = message_update.content
        message.is_edited = True
        message.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(message)
    
    # Load message with relationships
    message = db.query(ChatMessage).options(
        joinedload(ChatMessage.user)
    ).filter(ChatMessage.id == message_id).first()
    
    # Send real-time update
    update_data = {
        "id": message.id,
        "content": message.content,
        "is_edited": message.is_edited,
        "updated_at": message.updated_at.isoformat()
    }
    
    await manager.send_to_room({
        "type": "message_updated",
        "data": update_data
    }, message.room_id)
    
    return message


@router.delete("/messages/{message_id}")
async def delete_message(
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a chat message (only by the sender)
    """
    message = db.query(ChatMessage).filter(
        ChatMessage.id == message_id,
        ChatMessage.user_id == current_user.id
    ).first()
    
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found or not authorized to delete"
        )
    
    # Soft delete
    message.is_deleted = True
    message.updated_at = datetime.utcnow()
    
    db.commit()
    
    # Send real-time update
    await manager.send_to_room({
        "type": "message_deleted",
        "message_id": message_id
    }, message.room_id)
    
    return {"message": "Message deleted successfully"}


@router.post("/rooms/{room_id}/invite")
async def invite_users_to_room(
    room_id: int,
    invite_data: ChatRoomInvite,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Invite users to chat room
    """
    # Check if user is participant and has permission
    participant = db.query(ChatParticipant).filter(
        ChatParticipant.room_id == room_id,
        ChatParticipant.user_id == current_user.id,
        ChatParticipant.is_active == True
    ).first()
    
    if not participant:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to invite users to this room"
        )
    
    room = db.query(ChatRoom).filter(ChatRoom.id == room_id).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat room not found"
        )
    
    invited_users = []
    for user_id in invite_data.user_ids:
        # Check if user exists
        user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
        if not user:
            continue
        
        # Check if already participant
        existing = db.query(ChatParticipant).filter(
            ChatParticipant.room_id == room_id,
            ChatParticipant.user_id == user_id
        ).first()
        
        if existing:
            # Reactivate if inactive
            if not existing.is_active:
                existing.is_active = True
                existing.joined_at = datetime.utcnow()
                invited_users.append(user_id)
        else:
            # Add new participant
            new_participant = ChatParticipant(
                room_id=room_id,
                user_id=user_id
            )
            db.add(new_participant)
            invited_users.append(user_id)
    
    db.commit()
    
    # Notify room about new participants
    for user_id in invited_users:
        await manager.join_room(user_id, room_id)
    
    return {
        "message": f"Invited {len(invited_users)} users to chat room",
        "invited_users": invited_users
    }


@router.post("/typing")
async def send_typing_indicator(
    typing_data: ChatTypingEvent,
    current_user: User = Depends(get_current_user)
):
    """
    Send typing indicator to chat room
    """
    await manager.send_typing_indicator(
        typing_data.room_id,
        current_user.id,
        typing_data.is_typing
    )
    
    return {"message": "Typing indicator sent"} 