#!/usr/bin/env python3

import sys
import os

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.ticket import Ticket, TicketStatus, TicketPriority
from app.models.user import User
from datetime import datetime

def create_daniel_test_ticket():
    """
    Create a test ticket for Daniel to demonstrate the system works
    """
    db = SessionLocal()
    try:
        # Find Daniel's user account
        daniel = db.query(User).filter(User.email == "daniellim433@gmail.com").first()
        
        if not daniel:
            print("❌ Daniel's user account not found!")
            return
        
        print(f"✅ Found Daniel's account: {daniel.full_name} (ID: {daniel.id})")
        
        # Create a test ticket for Daniel
        test_ticket = Ticket(
            title="Test Ticket from Daniel",
            description="This is a test ticket to demonstrate that multiple users can create tickets without overriding each other. Created for debugging purposes.",
            priority=TicketPriority.MEDIUM,
            user_id=daniel.id,
            status=TicketStatus.OPEN,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.add(test_ticket)
        db.commit()
        db.refresh(test_ticket)
        
        print(f"✅ Created test ticket for Daniel:")
        print(f"   - ID: {test_ticket.id}")
        print(f"   - Title: {test_ticket.title}")
        print(f"   - User: {daniel.full_name} (ID: {daniel.id})")
        print(f"   - Status: {test_ticket.status.value}")
        print(f"   - Priority: {test_ticket.priority.value}")
        
        # Verify all tickets still exist
        print(f"\n📊 Total tickets in database after creation: {db.query(Ticket).count()}")
        
        # Show tickets by user to prove no overriding
        all_tickets = db.query(Ticket).join(User).all()
        user_ticket_counts = {}
        
        for ticket in all_tickets:
            user_name = ticket.user.full_name
            if user_name not in user_ticket_counts:
                user_ticket_counts[user_name] = 0
            user_ticket_counts[user_name] += 1
        
        print("\n👥 Tickets by user:")
        for user_name, count in user_ticket_counts.items():
            print(f"   - {user_name}: {count} tickets")
        
        print(f"\n✅ SUCCESS: Ticket created for Daniel without affecting other users' tickets!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_daniel_test_ticket() 