from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import datetime
from app.models.ticket import TicketStatus, TicketPriority
from .user import UserSummary


class TicketBase(BaseModel):
    title: str
    description: str
    priority: Optional[TicketPriority] = TicketPriority.MEDIUM


class TicketCreate(TicketBase):
    @validator('title')
    def validate_title(cls, v):
        if len(v.strip()) < 3:
            raise ValueError('Title must be at least 3 characters long')
        return v.strip()
    
    @validator('description')
    def validate_description(cls, v):
        if len(v.strip()) < 10:
            raise ValueError('Description must be at least 10 characters long')
        return v.strip()


class TicketUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TicketStatus] = None
    priority: Optional[TicketPriority] = None
    assigned_to: Optional[int] = None


class CommentBase(BaseModel):
    content: str


class CommentCreate(CommentBase):
    is_internal: Optional[bool] = False
    
    @validator('content')
    def validate_content(cls, v):
        if len(v.strip()) < 1:
            raise ValueError('Comment content cannot be empty')
        return v.strip()


class CommentResponse(CommentBase):
    id: int
    ticket_id: int
    user: UserSummary
    is_internal: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class AttachmentResponse(BaseModel):
    id: int
    filename: str
    original_filename: str
    file_size: int
    content_type: str
    created_at: datetime
    uploader: UserSummary
    
    class Config:
        from_attributes = True


class TicketResponse(TicketBase):
    id: int
    status: TicketStatus
    user: UserSummary
    assigned_agent: Optional[UserSummary] = None
    comments: List[CommentResponse] = []
    attachments: List[AttachmentResponse] = []
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class TicketSummary(BaseModel):
    """Lightweight ticket info for lists"""
    id: int
    title: str
    status: TicketStatus
    priority: TicketPriority
    user: UserSummary
    assigned_agent: Optional[UserSummary] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class TicketStats(BaseModel):
    """Statistics for dashboard"""
    total: int
    open: int
    in_progress: int
    resolved: int
    closed: int
    high_priority: int
    medium_priority: int
    low_priority: int 