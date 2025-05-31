from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, create_tables
from app.core.auth import get_password_hash
from app.models.user import User, UserRole
from app.models.ticket import Ticket, TicketStatus, TicketPriority, Comment

def init_db() -> None:
    """
    Initialize database with sample data
    """
    # Create tables first
    print("Creating database tables...")
    create_tables()
    print("✅ Database tables created")
    
    db = SessionLocal()
    
    try:
        # Check if admin user already exists
        admin_user = db.query(User).filter(User.email == "admin@helpdesk.com").first()
        
        if not admin_user:
            print("Creating sample data...")
            
            # Create Admin User
            admin_user = User(
                email="admin@helpdesk.com",
                password_hash=get_password_hash("admin123"),
                first_name="Admin",
                last_name="User",
                role=UserRole.ADMIN
            )
            db.add(admin_user)
            
            # Create Support Agent
            agent_user = User(
                email="agent@helpdesk.com",
                password_hash=get_password_hash("agent123"),
                first_name="Support",
                last_name="Agent",
                role=UserRole.SUPPORT_AGENT
            )
            db.add(agent_user)
            
            # Create Customer Users
            customer1 = User(
                email="john@example.com",
                password_hash=get_password_hash("customer123"),
                first_name="John",
                last_name="Doe",
                role=UserRole.CUSTOMER
            )
            db.add(customer1)
            
            customer2 = User(
                email="jane@example.com",
                password_hash=get_password_hash("customer123"),
                first_name="Jane",
                last_name="Smith",
                role=UserRole.CUSTOMER
            )
            db.add(customer2)
            
            # Commit users first to get IDs
            db.commit()
            
            # Create Sample Tickets
            ticket1 = Ticket(
                title="Login Issues with My Account",
                description="I'm unable to login to my account. Keep getting 'invalid credentials' error even though I'm using the correct password.",
                priority=TicketPriority.HIGH,
                status=TicketStatus.OPEN,
                user_id=customer1.id
            )
            db.add(ticket1)
            
            ticket2 = Ticket(
                title="Feature Request: Dark Mode",
                description="Would love to see a dark mode option in the application. It would be great for night time usage.",
                priority=TicketPriority.MEDIUM,
                status=TicketStatus.IN_PROGRESS,
                user_id=customer2.id,
                assigned_to=agent_user.id
            )
            db.add(ticket2)
            
            ticket3 = Ticket(
                title="Billing Question About Invoice",
                description="I have a question about my latest invoice. There seems to be an unexpected charge that I don't understand.",
                priority=TicketPriority.LOW,
                status=TicketStatus.RESOLVED,
                user_id=customer1.id,
                assigned_to=agent_user.id
            )
            db.add(ticket3)
            
            ticket4 = Ticket(
                title="Mobile App Crashing",
                description="The mobile app keeps crashing when I try to upload a profile picture. This happens consistently on iOS.",
                priority=TicketPriority.HIGH,
                status=TicketStatus.OPEN,
                user_id=customer2.id
            )
            db.add(ticket4)
            
            # Commit tickets to get IDs
            db.commit()
            
            # Create Sample Comments
            comment1 = Comment(
                content="Hi John, I'll look into this login issue for you. Can you please confirm the email address you're trying to use?",
                ticket_id=ticket1.id,
                user_id=agent_user.id,
                is_internal=False
            )
            db.add(comment1)
            
            comment2 = Comment(
                content="We're currently working on implementing dark mode. This should be available in the next release.",
                ticket_id=ticket2.id,
                user_id=agent_user.id,
                is_internal=False
            )
            db.add(comment2)
            
            comment3 = Comment(
                content="Internal note: This is related to the recent pricing update. Need to send explanation email.",
                ticket_id=ticket3.id,
                user_id=agent_user.id,
                is_internal=True
            )
            db.add(comment3)
            
            comment4 = Comment(
                content="Thank you for the clarification! That makes sense now.",
                ticket_id=ticket3.id,
                user_id=customer1.id,
                is_internal=False
            )
            db.add(comment4)
            
            db.commit()
            
            print("✅ Sample data created successfully!")
            print("\n📋 Sample Accounts:")
            print("👑 Admin: admin@helpdesk.com / admin123")
            print("🛠️  Agent: agent@helpdesk.com / agent123")
            print("👤 Customer 1: john@example.com / customer123")
            print("👤 Customer 2: jane@example.com / customer123")
            print("\n🎫 Created 4 sample tickets with comments")
            
        else:
            print("✅ Database already initialized with sample data")
            
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_db() 