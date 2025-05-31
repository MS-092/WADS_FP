#!/usr/bin/env python3

import sys
import os

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.ticket import Ticket
from app.models.user import User
from sqlalchemy.orm import joinedload

def check_tickets():
    db = SessionLocal()
    try:
        tickets = db.query(Ticket).options(joinedload(Ticket.user)).all()
        print(f"Total tickets in database: {len(tickets)}")
        print("=" * 50)
        
        for ticket in tickets:
            print(f"ID: {ticket.id}")
            print(f"Title: {ticket.title}")
            print(f"User: {ticket.user.full_name} (ID: {ticket.user_id})")
            print(f"Status: {ticket.status}")
            print(f"Priority: {ticket.priority}")
            print(f"Created: {ticket.created_at}")
            print(f"Updated: {ticket.updated_at}")
            print("-" * 30)
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_tickets() 