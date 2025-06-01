import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.notification import Notification, NotificationType, NotificationPriority
from app.models.user import User, UserRole

def create_test_notifications():
    db = SessionLocal()
    try:
        # Get admin users
        admin_users = db.query(User).filter(User.role == UserRole.ADMIN).all()
        
        if not admin_users:
            print("No admin users found")
            return
        
        # Create some test notifications for admin users
        for admin in admin_users:
            notification = Notification(
                title=f"Test Notification for Admin {admin.id}",
                message="This is a test notification with the correct URL format",
                type=NotificationType.TICKET_CREATED,
                priority=NotificationPriority.MEDIUM,
                user_id=admin.id,
                ticket_id=16,  # Assuming ticket 16 exists
                action_url="/admin/tickets/16",  # Correct URL for admin
                is_read=False
            )
            db.add(notification)
            print(f"Created notification for admin user {admin.email}")
        
        # Also create notifications with the OLD format to test the fix
        for admin in admin_users:
            old_notification = Notification(
                title=f"Old Format Notification for Admin {admin.id}",
                message="This notification has the old URL format that needs fixing",
                type=NotificationType.TICKET_UPDATED,
                priority=NotificationPriority.MEDIUM,
                user_id=admin.id,
                ticket_id=15,
                action_url="/tickets/15",  # OLD format - should be fixed
                is_read=False
            )
            db.add(old_notification)
            print(f"Created old-format notification for admin user {admin.email}")
        
        db.commit()
        print("✅ Test notifications created successfully!")
        
        # Now check what we have
        notifications = db.query(Notification).all()
        print(f"\nTotal notifications in database: {len(notifications)}")
        
        for notif in notifications[-5:]:  # Show last 5
            print(f"  ID {notif.id}: {notif.title}")
            print(f"    action_url: '{notif.action_url}'")
            print()
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_notifications() 