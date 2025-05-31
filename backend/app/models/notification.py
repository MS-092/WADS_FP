from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum as PyEnum
from app.core.database import Base


class NotificationType(PyEnum):
    TICKET_CREATED = "ticket_created"
    TICKET_UPDATED = "ticket_updated"
    TICKET_ASSIGNED = "ticket_assigned"
    TICKET_RESOLVED = "ticket_resolved"
    COMMENT_ADDED = "comment_added"
    MESSAGE_RECEIVED = "message_received"
    USER_MENTIONED = "user_mentioned"
    FILE_UPLOADED = "file_uploaded"
    SYSTEM_ANNOUNCEMENT = "system_announcement"


class NotificationPriority(PyEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    type = Column(Enum(NotificationType), nullable=False, index=True)
    priority = Column(Enum(NotificationPriority), default=NotificationPriority.MEDIUM, nullable=False)
    
    # Status
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    is_dismissed = Column(Boolean, default=False, nullable=False)
    
    # Foreign Keys
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=True, index=True)
    chat_room_id = Column(Integer, ForeignKey("chat_rooms.id"), nullable=True, index=True)
    triggered_by = Column(Integer, ForeignKey("users.id"), nullable=True)  # Who caused this notification
    
    # Additional data (JSON field for flexible metadata)
    extra_data = Column(JSON, nullable=True)
    
    # Action URL for frontend navigation
    action_url = Column(String, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    read_at = Column(DateTime(timezone=True), nullable=True)
    dismissed_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)  # For temporary notifications
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    ticket = relationship("Ticket")
    # chat_room = relationship("ChatRoom")  # Commented out temporarily
    trigger_user = relationship("User", foreign_keys=[triggered_by])
    
    def __repr__(self):
        return f"<Notification(id={self.id}, type='{self.type.value}', user_id={self.user_id})>"


class NotificationTemplate(Base):
    __tablename__ = "notification_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)
    type = Column(Enum(NotificationType), nullable=False)
    title_template = Column(String, nullable=False)
    message_template = Column(Text, nullable=False)
    priority = Column(Enum(NotificationPriority), default=NotificationPriority.MEDIUM, nullable=False)
    
    # Settings
    is_active = Column(Boolean, default=True, nullable=False)
    send_email = Column(Boolean, default=False, nullable=False)  # Future: email notifications
    send_push = Column(Boolean, default=True, nullable=False)   # Real-time push notifications
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<NotificationTemplate(name='{self.name}', type='{self.type.value}')>"


class UserNotificationSettings(Base):
    __tablename__ = "user_notification_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign Key
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True, index=True)
    
    # Notification preferences by type
    ticket_updates = Column(Boolean, default=True, nullable=False)
    new_messages = Column(Boolean, default=True, nullable=False)
    mentions = Column(Boolean, default=True, nullable=False)
    assignments = Column(Boolean, default=True, nullable=False)
    system_announcements = Column(Boolean, default=True, nullable=False)
    
    # Delivery preferences
    email_notifications = Column(Boolean, default=False, nullable=False)
    push_notifications = Column(Boolean, default=True, nullable=False)
    
    # Quiet hours (JSON field with start/end times)
    quiet_hours = Column(JSON, nullable=True)  # e.g., {"start": "22:00", "end": "08:00"}
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", backref="notification_settings")
    
    def __repr__(self):
        return f"<UserNotificationSettings(user_id={self.user_id})>" 