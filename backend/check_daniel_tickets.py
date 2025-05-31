#!/usr/bin/env python3

import sys
import os

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.ticket import Ticket
from app.models.user import User
from sqlalchemy.orm import joinedload

def check_daniel_tickets():
    db = SessionLocal()
    try:
        # Check tickets by Daniel Lim (ID: 6)
        tickets = db.query(Ticket).filter(Ticket.user_id == 6).all()
        print(f"Tickets created by Daniel Lim (ID: 6): {len(tickets)}")
        
        for ticket in tickets:
            print(f"ID: {ticket.id}, Title: {ticket.title}, Created: {ticket.created_at}")
            
        # Also check all tickets to see the latest ones
        print("\nAll tickets in database (latest first):")
        all_tickets = db.query(Ticket).options(joinedload(Ticket.user)).order_by(Ticket.created_at.desc()).all()
        for ticket in all_tickets:
            user_name = ticket.user.full_name if ticket.user else "Unknown User"
            print(f"ID: {ticket.id}, Title: {ticket.title}, User: {user_name} (ID: {ticket.user_id}), Created: {ticket.created_at}")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_daniel_tickets() 