from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_admin_user
from app.core.notifications import notification_service
from app.models.user import User
from app.models.notification import (
    Notification, NotificationTemplate, UserNotificationSettings,
    NotificationType, NotificationPriority
)
from app.schemas.notification import (
    NotificationResponse, NotificationSummary, NotificationStats,
    NotificationUpdate, NotificationBulkAction,
    NotificationTemplateCreate, NotificationTemplateUpdate, NotificationTemplateResponse,
    UserNotificationSettingsUpdate, UserNotificationSettingsResponse
)

router = APIRouter()


@router.get("/", response_model=List[NotificationSummary])
def list_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    unread_only: bool = Query(False),
    notification_type: Optional[NotificationType] = None,
    priority: Optional[NotificationPriority] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user's notifications
    """
    query = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_dismissed == False
    )
    
    if unread_only:
        query = query.filter(Notification.is_read == False)
    
    if notification_type:
        query = query.filter(Notification.type == notification_type)
    
    if priority:
        query = query.filter(Notification.priority == priority)
    
    # Check for expired notifications
    query = query.filter(
        (Notification.expires_at.is_(None)) | 
        (Notification.expires_at > datetime.utcnow())
    )
    
    notifications = query.order_by(
        Notification.priority.desc(),
        Notification.created_at.desc()
    ).offset(skip).limit(limit).all()
    
    return notifications


@router.get("/{notification_id}", response_model=NotificationResponse)
def get_notification(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get specific notification
    """
    notification = db.query(Notification).options(
        joinedload(Notification.trigger_user)
    ).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    return notification


@router.put("/{notification_id}", response_model=NotificationResponse)
async def update_notification(
    notification_id: int,
    notification_update: NotificationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update notification (mark as read/dismissed)
    """
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    update_data = notification_update.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        if field == "is_read" and value and not notification.is_read:
            notification.read_at = datetime.utcnow()
        elif field == "is_dismissed" and value and not notification.is_dismissed:
            notification.dismissed_at = datetime.utcnow()
        
        setattr(notification, field, value)
    
    db.commit()
    db.refresh(notification)
    
    return notification


@router.post("/bulk-action")
async def bulk_notification_action(
    bulk_action: NotificationBulkAction,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Perform bulk actions on notifications
    """
    notifications = db.query(Notification).filter(
        Notification.id.in_(bulk_action.notification_ids),
        Notification.user_id == current_user.id
    ).all()
    
    if not notifications:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No notifications found"
        )
    
    updated_count = 0
    
    for notification in notifications:
        if bulk_action.action == "mark_read":
            if not notification.is_read:
                notification.is_read = True
                notification.read_at = datetime.utcnow()
                updated_count += 1
        elif bulk_action.action == "mark_unread":
            if notification.is_read:
                notification.is_read = False
                notification.read_at = None
                updated_count += 1
        elif bulk_action.action == "dismiss":
            if not notification.is_dismissed:
                notification.is_dismissed = True
                notification.dismissed_at = datetime.utcnow()
                updated_count += 1
    
    db.commit()
    
    return {
        "message": f"{bulk_action.action} applied to {updated_count} notifications",
        "updated_count": updated_count
    }


@router.get("/stats/summary", response_model=NotificationStats)
def get_notification_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get notification statistics for user
    """
    base_query = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_dismissed == False
    )
    
    total = base_query.count()
    unread = base_query.filter(Notification.is_read == False).count()
    
    # Count by type
    by_type = {}
    for notification_type in NotificationType:
        count = base_query.filter(Notification.type == notification_type).count()
        by_type[notification_type.value] = count
    
    # Count by priority
    by_priority = {}
    for priority in NotificationPriority:
        count = base_query.filter(Notification.priority == priority).count()
        by_priority[priority.value] = count
    
    return NotificationStats(
        total=total,
        unread=unread,
        by_type=by_type,
        by_priority=by_priority
    )


@router.get("/settings", response_model=UserNotificationSettingsResponse)
def get_notification_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user's notification settings
    """
    settings = db.query(UserNotificationSettings).filter(
        UserNotificationSettings.user_id == current_user.id
    ).first()
    
    if not settings:
        # Create default settings
        settings = UserNotificationSettings(user_id=current_user.id)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    
    return settings


@router.put("/settings", response_model=UserNotificationSettingsResponse)
def update_notification_settings(
    settings_update: UserNotificationSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update user's notification settings
    """
    settings = db.query(UserNotificationSettings).filter(
        UserNotificationSettings.user_id == current_user.id
    ).first()
    
    if not settings:
        # Create new settings
        settings = UserNotificationSettings(
            user_id=current_user.id,
            **settings_update.dict()
        )
        db.add(settings)
    else:
        # Update existing settings
        update_data = settings_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(settings, field, value)
        settings.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(settings)
    
    return settings


# Admin-only endpoints for managing notification templates

@router.get("/templates", response_model=List[NotificationTemplateResponse])
def list_notification_templates(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get all notification templates (Admin only)
    """
    templates = db.query(NotificationTemplate).order_by(
        NotificationTemplate.type,
        NotificationTemplate.name
    ).all()
    
    return templates


@router.post("/templates", response_model=NotificationTemplateResponse, status_code=status.HTTP_201_CREATED)
def create_notification_template(
    template_data: NotificationTemplateCreate,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    Create notification template (Admin only)
    """
    # Check if template name already exists
    existing = db.query(NotificationTemplate).filter(
        NotificationTemplate.name == template_data.name
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Template name already exists"
        )
    
    template = NotificationTemplate(**template_data.dict())
    db.add(template)
    db.commit()
    db.refresh(template)
    
    return template


@router.put("/templates/{template_id}", response_model=NotificationTemplateResponse)
def update_notification_template(
    template_id: int,
    template_update: NotificationTemplateUpdate,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    Update notification template (Admin only)
    """
    template = db.query(NotificationTemplate).filter(
        NotificationTemplate.id == template_id
    ).first()
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    update_data = template_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(template, field, value)
    
    template.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(template)
    
    return template


@router.delete("/templates/{template_id}")
def delete_notification_template(
    template_id: int,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    Delete notification template (Admin only)
    """
    template = db.query(NotificationTemplate).filter(
        NotificationTemplate.id == template_id
    ).first()
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    db.delete(template)
    db.commit()
    
    return {"message": f"Template '{template.name}' deleted successfully"}


@router.post("/test-template/{template_id}")
async def test_notification_template(
    template_id: int,
    test_context: dict,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    Test notification template with sample context (Admin only)
    """
    template = db.query(NotificationTemplate).filter(
        NotificationTemplate.id == template_id
    ).first()
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    try:
        # Test template rendering
        title = template.title_template.format(**test_context)
        message = template.message_template.format(**test_context)
        
        return {
            "template_id": template_id,
            "template_name": template.name,
            "rendered_title": title,
            "rendered_message": message,
            "test_context": test_context
        }
        
    except KeyError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Missing context key: {e}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Template rendering failed: {str(e)}"
        )


@router.post("/send-announcement")
async def send_system_announcement(
    title: str,
    message: str,
    target_roles: List[str] = None,
    priority: NotificationPriority = NotificationPriority.MEDIUM,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    Send system announcement to users (Admin only)
    """
    from app.models.user import UserRole
    
    # Get target users
    query = db.query(User).filter(User.is_active == True)
    
    if target_roles:
        valid_roles = [role for role in UserRole if role.value in target_roles]
        query = query.filter(User.role.in_(valid_roles))
    
    target_users = query.all()
    
    sent_count = 0
    for user in target_users:
        try:
            await notification_service.create_notification(
                db=db,
                user_id=user.id,
                notification_type=NotificationType.SYSTEM_ANNOUNCEMENT,
                title=title,
                message=message,
                priority=priority,
                triggered_by=current_user.id
            )
            sent_count += 1
        except Exception as e:
            print(f"Failed to send notification to user {user.id}: {e}")
    
    return {
        "message": f"System announcement sent to {sent_count} users",
        "target_count": len(target_users),
        "sent_count": sent_count
    } 