from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum as PyEnum
from app.core.database import Base


class ChatRoomType(PyEnum):
    DIRECT = "direct"  # Direct chat between customer and agent
    TICKET = "ticket"  # Chat related to a specific ticket
    GROUP = "group"    # Group chat (future feature)


class ChatRoom(Base):
    __tablename__ = "chat_rooms"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=True)  # Optional room name
    type = Column(Enum(ChatRoomType), default=ChatRoomType.DIRECT, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Foreign Keys
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=True, index=True)  # For ticket chats
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    last_message_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    ticket = relationship("Ticket", backref="chat_rooms")
    creator = relationship("User", foreign_keys=[created_by])
    messages = relationship("ChatMessage", back_populates="room", cascade="all, delete-orphan")
    participants = relationship("ChatParticipant", back_populates="room", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<ChatRoom(id={self.id}, type='{self.type.value}', ticket_id={self.ticket_id})>"


class ChatParticipant(Base):
    __tablename__ = "chat_participants"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign Keys
    room_id = Column(Integer, ForeignKey("chat_rooms.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Participant Status
    is_active = Column(Boolean, default=True, nullable=False)
    last_read_at = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    left_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    room = relationship("ChatRoom", back_populates="participants")
    user = relationship("User")
    
    def __repr__(self):
        return f"<ChatParticipant(room_id={self.room_id}, user_id={self.user_id})>"


class MessageType(PyEnum):
    TEXT = "text"
    FILE = "file"
    IMAGE = "image"
    SYSTEM = "system"  # System messages (user joined, ticket assigned, etc.)


class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    message_type = Column(Enum(MessageType), default=MessageType.TEXT, nullable=False)
    
    # File/Image specific fields
    file_url = Column(String, nullable=True)
    file_name = Column(String, nullable=True)
    file_size = Column(Integer, nullable=True)
    
    # Message status
    is_edited = Column(Boolean, default=False, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
    
    # Foreign Keys
    room_id = Column(Integer, ForeignKey("chat_rooms.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    reply_to_id = Column(Integer, ForeignKey("chat_messages.id"), nullable=True)  # For replies
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    room = relationship("ChatRoom", back_populates="messages")
    user = relationship("User")
    reply_to = relationship("ChatMessage", remote_side=[id])
    
    def __repr__(self):
        return f"<ChatMessage(id={self.id}, room_id={self.room_id}, user_id={self.user_id})>" 