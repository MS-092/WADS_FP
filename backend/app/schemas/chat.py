from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import datetime
from app.models.chat import ChatRoomType, MessageType
from .user import UserSummary


class ChatRoomBase(BaseModel):
    name: Optional[str] = None
    type: ChatRoomType = ChatRoomType.DIRECT


class ChatRoomCreate(ChatRoomBase):
    ticket_id: Optional[int] = None
    participant_ids: List[int] = []


class ChatParticipantResponse(BaseModel):
    id: int
    user: UserSummary
    is_active: bool
    last_read_at: Optional[datetime] = None
    joined_at: datetime
    
    class Config:
        from_attributes = True


class ChatMessageBase(BaseModel):
    content: str
    message_type: MessageType = MessageType.TEXT


class ChatMessageCreate(ChatMessageBase):
    reply_to_id: Optional[int] = None
    
    @validator('content')
    def validate_content(cls, v):
        if len(v.strip()) < 1:
            raise ValueError('Message content cannot be empty')
        return v.strip()


class ChatMessageUpdate(BaseModel):
    content: Optional[str] = None
    
    @validator('content')
    def validate_content(cls, v):
        if v is not None and len(v.strip()) < 1:
            raise ValueError('Message content cannot be empty')
        return v.strip() if v else v


class ChatMessageResponse(ChatMessageBase):
    id: int
    room_id: int
    user: UserSummary
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    file_size: Optional[int] = None
    is_edited: bool
    is_deleted: bool
    reply_to_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ChatRoomResponse(ChatRoomBase):
    id: int
    is_active: bool
    ticket_id: Optional[int] = None
    created_by: int
    creator: UserSummary
    participants: List[ChatParticipantResponse] = []
    last_message_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ChatRoomSummary(BaseModel):
    """Lightweight chat room info for lists"""
    id: int
    name: Optional[str] = None
    type: ChatRoomType
    is_active: bool
    ticket_id: Optional[int] = None
    participant_count: int
    unread_count: int = 0
    last_message_at: Optional[datetime] = None
    last_message_preview: Optional[str] = None
    
    class Config:
        from_attributes = True


class ChatMessageFile(BaseModel):
    """Schema for file messages"""
    file_url: str
    file_name: str
    file_size: int
    content_type: str


class ChatRoomInvite(BaseModel):
    """Schema for inviting users to chat room"""
    user_ids: List[int]


class ChatTypingEvent(BaseModel):
    """Schema for typing indicators"""
    room_id: int
    user_id: int
    is_typing: bool


class ChatMessageReaction(BaseModel):
    """Schema for message reactions (future feature)"""
    message_id: int
    emoji: str
    user_id: int 