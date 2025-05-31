from pydantic import BaseModel, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.models.notification import NotificationType, NotificationPriority
from .user import UserSummary


class NotificationBase(BaseModel):
    title: str
    message: str
    type: NotificationType
    priority: NotificationPriority = NotificationPriority.MEDIUM


class NotificationCreate(NotificationBase):
    user_id: int
    ticket_id: Optional[int] = None
    chat_room_id: Optional[int] = None
    triggered_by: Optional[int] = None
    extra_data: Optional[Dict[str, Any]] = None
    action_url: Optional[str] = None
    expires_at: Optional[datetime] = None


class NotificationUpdate(BaseModel):
    is_read: Optional[bool] = None
    is_dismissed: Optional[bool] = None


class NotificationResponse(NotificationBase):
    id: int
    user_id: int
    ticket_id: Optional[int] = None
    chat_room_id: Optional[int] = None
    triggered_by: Optional[int] = None
    trigger_user: Optional[UserSummary] = None
    extra_data: Optional[Dict[str, Any]] = None
    action_url: Optional[str] = None
    is_read: bool
    is_dismissed: bool
    created_at: datetime
    read_at: Optional[datetime] = None
    dismissed_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class NotificationSummary(BaseModel):
    """Lightweight notification info for lists"""
    id: int
    title: str
    type: NotificationType
    priority: NotificationPriority
    is_read: bool
    created_at: datetime
    action_url: Optional[str] = None
    
    class Config:
        from_attributes = True


class NotificationStats(BaseModel):
    """Notification statistics"""
    total: int
    unread: int
    by_type: Dict[str, int]
    by_priority: Dict[str, int]


class NotificationTemplateBase(BaseModel):
    name: str
    type: NotificationType
    title_template: str
    message_template: str
    priority: NotificationPriority = NotificationPriority.MEDIUM


class NotificationTemplateCreate(NotificationTemplateBase):
    is_active: bool = True
    send_email: bool = False
    send_push: bool = True


class NotificationTemplateUpdate(BaseModel):
    title_template: Optional[str] = None
    message_template: Optional[str] = None
    priority: Optional[NotificationPriority] = None
    is_active: Optional[bool] = None
    send_email: Optional[bool] = None
    send_push: Optional[bool] = None


class NotificationTemplateResponse(NotificationTemplateBase):
    id: int
    is_active: bool
    send_email: bool
    send_push: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class UserNotificationSettingsBase(BaseModel):
    ticket_updates: bool = True
    new_messages: bool = True
    mentions: bool = True
    assignments: bool = True
    system_announcements: bool = True
    email_notifications: bool = False
    push_notifications: bool = True


class UserNotificationSettingsUpdate(UserNotificationSettingsBase):
    quiet_hours: Optional[Dict[str, str]] = None  # {"start": "22:00", "end": "08:00"}


class UserNotificationSettingsResponse(UserNotificationSettingsBase):
    id: int
    user_id: int
    quiet_hours: Optional[Dict[str, str]] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class NotificationBulkAction(BaseModel):
    """Schema for bulk notification actions"""
    notification_ids: List[int]
    action: str  # "mark_read", "mark_unread", "dismiss"


class NotificationPreferences(BaseModel):
    """User notification preferences"""
    types: List[NotificationType]
    priorities: List[NotificationPriority]
    delivery_methods: List[str]  # ["push", "email"] 