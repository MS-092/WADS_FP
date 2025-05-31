#!/usr/bin/env python3

import sys
import os

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.ticket import Ticket
from app.models.user import User
from sqlalchemy.orm import joinedload

def check_ticket_5():
    db = SessionLocal()
    try:
        # Check ticket 5 specifically
        ticket = db.query(Ticket).filter(Ticket.id == 5).first()
        
        if ticket:
            print(f"Ticket ID: {ticket.id}")
            print(f"Title: {ticket.title}")
            print(f"Description: {ticket.description}")
            print(f"user_id field: {ticket.user_id}")
            print(f"Status: {ticket.status}")
            print(f"Priority: {ticket.priority}")
            print(f"Created: {ticket.created_at}")
            
            # Try to load user relationship
            try:
                if ticket.user_id:
                    user = db.query(User).filter(User.id == ticket.user_id).first()
                    if user:
                        print(f"User found: {user.full_name}")
                    else:
                        print(f"User with ID {ticket.user_id} not found!")
                else:
                    print("No user_id set for this ticket!")
            except Exception as e:
                print(f"Error loading user: {e}")
                
        else:
            print("Ticket 5 not found")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_ticket_5() 