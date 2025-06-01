from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime
from app.models.notification import (
    Notification, NotificationTemplate, UserNotificationSettings,
    NotificationType, NotificationPriority
)
from app.models.user import User, UserRole
from app.models.ticket import Ticket
from app.core.websocket import manager
from app.core.database import SessionLocal
import logging

logger = logging.getLogger(__name__)


class NotificationService:
    """
    Service for creating and managing notifications
    """
    
    def __init__(self):
        self.templates = {}  # Cache for notification templates
        
    async def create_notification(
        self,
        db: Session,
        user_id: int,
        notification_type: NotificationType,
        title: str,
        message: str,
        priority: NotificationPriority = NotificationPriority.MEDIUM,
        ticket_id: Optional[int] = None,
        chat_room_id: Optional[int] = None,
        triggered_by: Optional[int] = None,
        extra_data: Optional[Dict[str, Any]] = None,
        action_url: Optional[str] = None,
        expires_at: Optional[datetime] = None,
        send_realtime: bool = True
    ) -> Notification:
        """
        Create a new notification
        """
        try:
            # Check user notification settings
            settings = db.query(UserNotificationSettings).filter(
                UserNotificationSettings.user_id == user_id
            ).first()
            
            if not settings:
                # Create default settings for user
                settings = UserNotificationSettings(user_id=user_id)
                db.add(settings)
                db.commit()
            
            # Check if user wants this type of notification
            if not self._should_send_notification(settings, notification_type):
                logger.info(f"Notification blocked by user settings: user_id={user_id}, type={notification_type}")
                return None
            
            # Create notification
            notification = Notification(
                title=title,
                message=message,
                type=notification_type,
                priority=priority,
                user_id=user_id,
                ticket_id=ticket_id,
                chat_room_id=chat_room_id,
                triggered_by=triggered_by,
                extra_data=extra_data,
                action_url=action_url,
                expires_at=expires_at
            )
            
            db.add(notification)
            db.commit()
            db.refresh(notification)
            
            # Send real-time notification if enabled
            if send_realtime and settings.push_notifications:
                await self._send_realtime_notification(notification)
            
            logger.info(f"Notification created: id={notification.id}, user_id={user_id}, type={notification_type}")
            return notification
            
        except Exception as e:
            logger.error(f"Error creating notification: {e}")
            db.rollback()
            raise
    
    async def create_from_template(
        self,
        db: Session,
        template_name: str,
        user_id: int,
        context: Dict[str, Any],
        **kwargs
    ) -> Optional[Notification]:
        """
        Create notification from template with context substitution
        """
        template = db.query(NotificationTemplate).filter(
            NotificationTemplate.name == template_name,
            NotificationTemplate.is_active == True
        ).first()
        
        if not template:
            logger.error(f"Notification template not found: {template_name}")
            return None
        
        try:
            # Substitute template variables
            title = template.title_template.format(**context)
            message = template.message_template.format(**context)
            
            return await self.create_notification(
                db=db,
                user_id=user_id,
                notification_type=template.type,
                title=title,
                message=message,
                priority=template.priority,
                send_realtime=template.send_push,
                **kwargs
            )
            
        except KeyError as e:
            logger.error(f"Template context missing key: {e}")
            return None
        except Exception as e:
            logger.error(f"Error creating notification from template: {e}")
            return None
    
    async def notify_ticket_created(self, db: Session, ticket: Ticket):
        """
        Send notification when ticket is created
        """
        # Notify all admins
        admins = db.query(User).filter(
            User.role == UserRole.ADMIN,
            User.is_active == True
        ).all()
        
        for user in admins:
            # Set admin-specific action URL for admin users
            action_url = f"/admin/tickets/{ticket.id}"
            
            await self.create_from_template(
                db=db,
                template_name="ticket_created",
                user_id=user.id,
                context={
                    "ticket_id": ticket.id,
                    "ticket_title": ticket.title,
                    "customer_name": ticket.user.full_name,
                    "priority": ticket.priority.value
                },
                ticket_id=ticket.id,
                triggered_by=ticket.user_id,
                action_url=action_url
            )
    
    async def notify_ticket_assigned(self, db: Session, ticket: Ticket, assigned_to: User, assigned_by: User):
        """
        Send notification when ticket is assigned
        """
        # Notify the assigned admin - use admin URL for admins
        admin_action_url = f"/admin/tickets/{ticket.id}"
        await self.create_from_template(
            db=db,
            template_name="ticket_assigned",
            user_id=assigned_to.id,
            context={
                "ticket_id": ticket.id,
                "ticket_title": ticket.title,
                "assigned_by": assigned_by.full_name
            },
            ticket_id=ticket.id,
            triggered_by=assigned_by.id,
            action_url=admin_action_url
        )
        
        # Notify the customer - use customer URL
        customer_action_url = f"/dashboard/tickets/{ticket.id}"
        await self.create_from_template(
            db=db,
            template_name="ticket_agent_assigned",
            user_id=ticket.user_id,
            context={
                "ticket_id": ticket.id,
                "ticket_title": ticket.title,
                "agent_name": assigned_to.full_name
            },
            ticket_id=ticket.id,
            triggered_by=assigned_by.id,
            action_url=customer_action_url
        )
    
    async def notify_comment_added(self, db: Session, comment, ticket: Ticket):
        """
        Send notification when comment is added to ticket
        """
        # Notify ticket participants (customer and assigned agent)
        recipients = [ticket.user_id]  # Always notify customer
        
        if ticket.assigned_to and ticket.assigned_to != comment.user_id:
            recipients.append(ticket.assigned_to)
        
        # Remove the comment author from recipients
        recipients = [uid for uid in recipients if uid != comment.user_id]
        
        for user_id in recipients:
            # Get user to determine the correct URL
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                continue
                
            # Determine action URL based on user role
            if user.role == UserRole.ADMIN:
                action_url = f"/admin/tickets/{ticket.id}#comment-{comment.id}"
            else:  # Customer
                action_url = f"/dashboard/tickets/{ticket.id}#comment-{comment.id}"
                
            await self.create_from_template(
                db=db,
                template_name="comment_added",
                user_id=user_id,
                context={
                    "ticket_id": ticket.id,
                    "ticket_title": ticket.title,
                    "commenter_name": comment.user.full_name,
                    "comment_preview": comment.content[:100] + "..." if len(comment.content) > 100 else comment.content
                },
                ticket_id=ticket.id,
                triggered_by=comment.user_id,
                action_url=action_url
            )
    
    async def notify_ticket_resolved(self, db: Session, ticket: Ticket, resolved_by: User):
        """
        Send notification when ticket is resolved
        """
        # Notify the customer - use customer dashboard URL
        customer_action_url = f"/dashboard/tickets/{ticket.id}"
        await self.create_from_template(
            db=db,
            template_name="ticket_resolved",
            user_id=ticket.user_id,
            context={
                "ticket_id": ticket.id,
                "ticket_title": ticket.title,
                "resolved_by": resolved_by.full_name
            },
            ticket_id=ticket.id,
            triggered_by=resolved_by.id,
            action_url=customer_action_url
        )
    
    async def notify_message_received(self, db: Session, message, room, sender: User):
        """
        Send notification for new chat message
        """
        # Get room participants except sender
        participants = db.query(User).join(
            "chat_participants"  # This would need proper relationship setup
        ).filter(
            # Add proper filters for chat participants
        ).all()
        
        for participant in participants:
            if participant.id != sender.id:
                await self.create_from_template(
                    db=db,
                    template_name="message_received",
                    user_id=participant.id,
                    context={
                        "sender_name": sender.full_name,
                        "room_name": room.name or f"Chat with {sender.full_name}",
                        "message_preview": message.content[:50] + "..." if len(message.content) > 50 else message.content
                    },
                    chat_room_id=room.id,
                    triggered_by=sender.id,
                    action_url=f"/chat/{room.id}"
                )
    
    async def mark_as_read(self, db: Session, notification_id: int, user_id: int) -> bool:
        """
        Mark notification as read
        """
        notification = db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == user_id
        ).first()
        
        if notification and not notification.is_read:
            notification.is_read = True
            notification.read_at = datetime.utcnow()
            db.commit()
            return True
        
        return False
    
    async def mark_as_dismissed(self, db: Session, notification_id: int, user_id: int) -> bool:
        """
        Mark notification as dismissed
        """
        notification = db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == user_id
        ).first()
        
        if notification and not notification.is_dismissed:
            notification.is_dismissed = True
            notification.dismissed_at = datetime.utcnow()
            db.commit()
            return True
        
        return False
    
    async def _send_realtime_notification(self, notification: Notification):
        """
        Send real-time notification via WebSocket
        """
        try:
            notification_data = {
                "id": notification.id,
                "title": notification.title,
                "message": notification.message,
                "type": notification.type.value,
                "priority": notification.priority.value,
                "action_url": notification.action_url,
                "created_at": notification.created_at.isoformat()
            }
            
            await manager.send_notification(notification.user_id, notification_data)
            
        except Exception as e:
            logger.error(f"Error sending real-time notification: {e}")
    
    def _should_send_notification(self, settings: UserNotificationSettings, notification_type: NotificationType) -> bool:
        """
        Check if notification should be sent based on user settings
        """
        type_mapping = {
            NotificationType.TICKET_CREATED: settings.ticket_updates,
            NotificationType.TICKET_UPDATED: settings.ticket_updates,
            NotificationType.TICKET_ASSIGNED: settings.assignments,
            NotificationType.TICKET_RESOLVED: settings.ticket_updates,
            NotificationType.COMMENT_ADDED: settings.ticket_updates,
            NotificationType.MESSAGE_RECEIVED: settings.new_messages,
            NotificationType.USER_MENTIONED: settings.mentions,
            NotificationType.SYSTEM_ANNOUNCEMENT: settings.system_announcements,
        }
        
        return type_mapping.get(notification_type, True)


# Global notification service instance
notification_service = NotificationService()


async def init_notification_templates(db: Session):
    """
    Initialize default notification templates
    """
    templates = [
        {
            "name": "ticket_created",
            "type": NotificationType.TICKET_CREATED,
            "title_template": "New Ticket #{ticket_id}: {ticket_title}",
            "message_template": "A new {priority} priority ticket has been created by {customer_name}.",
            "priority": NotificationPriority.MEDIUM
        },
        {
            "name": "ticket_assigned",
            "type": NotificationType.TICKET_ASSIGNED,
            "title_template": "Ticket #{ticket_id} Assigned to You",
            "message_template": "You have been assigned to ticket '{ticket_title}' by {assigned_by}.",
            "priority": NotificationPriority.HIGH
        },
        {
            "name": "ticket_agent_assigned",
            "type": NotificationType.TICKET_ASSIGNED,
            "title_template": "Agent Assigned to Your Ticket #{ticket_id}",
            "message_template": "{agent_name} has been assigned to help you with '{ticket_title}'.",
            "priority": NotificationPriority.MEDIUM
        },
        {
            "name": "comment_added",
            "type": NotificationType.COMMENT_ADDED,
            "title_template": "New Comment on Ticket #{ticket_id}",
            "message_template": "{commenter_name} added a comment: {comment_preview}",
            "priority": NotificationPriority.MEDIUM
        },
        {
            "name": "ticket_resolved",
            "type": NotificationType.TICKET_RESOLVED,
            "title_template": "Ticket #{ticket_id} Resolved",
            "message_template": "Your ticket '{ticket_title}' has been resolved by {resolved_by}.",
            "priority": NotificationPriority.HIGH
        },
        {
            "name": "message_received",
            "type": NotificationType.MESSAGE_RECEIVED,
            "title_template": "New Message from {sender_name}",
            "message_template": "You have a new message in {room_name}: {message_preview}",
            "priority": NotificationPriority.MEDIUM
        }
    ]
    
    for template_data in templates:
        existing = db.query(NotificationTemplate).filter(
            NotificationTemplate.name == template_data["name"]
        ).first()
        
        if not existing:
            template = NotificationTemplate(**template_data)
            db.add(template)
    
    db.commit()
    logger.info(f"Initialized {len(templates)} notification templates") 