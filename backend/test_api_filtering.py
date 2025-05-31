#!/usr/bin/env python3

import sys
import os

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.ticket import Ticket
from app.models.user import User, UserRole
from sqlalchemy.orm import joinedload
from sqlalchemy import or_

def simulate_api_filtering():
    db = SessionLocal()
    try:
        # Test for each user type
        users_to_test = [
            {"id": 1, "role": UserRole.ADMIN, "name": "Admin User"},
            {"id": 6, "role": UserRole.CUSTOMER, "name": "Daniel Lim"},
            {"id": 3, "role": UserRole.CUSTOMER, "name": "John Doe"},
            {"id": 4, "role": UserRole.CUSTOMER, "name": "Jane Smith"},
        ]
        
        for user_test in users_to_test:
            print(f"\n{'='*50}")
            print(f"Testing as {user_test['name']} (ID: {user_test['id']}, Role: {user_test['role']})")
            print(f"{'='*50}")
            
            # Simulate the API query logic
            query = db.query(Ticket).options(
                joinedload(Ticket.user),
                joinedload(Ticket.assigned_agent)
            )
            
            # Apply role-based filtering (same logic as in tickets.py)
            if user_test['role'] == UserRole.CUSTOMER:
                # Customers can only see their own tickets
                query = query.filter(Ticket.user_id == user_test['id'])
            elif user_test['role'] == UserRole.SUPPORT_AGENT:
                # Agents can see tickets assigned to them or unassigned tickets
                query = query.filter(
                    or_(
                        Ticket.assigned_to == user_test['id'],
                        Ticket.assigned_to.is_(None)
                    )
                )
            # Admins can see all tickets (no additional filter)
            
            # Order by creation date (newest first)
            query = query.order_by(Ticket.created_at.desc())
            
            tickets = query.all()
            
            print(f"Tickets visible to this user: {len(tickets)}")
            for ticket in tickets:
                user_name = ticket.user.full_name if ticket.user else "Unknown User"
                print(f"  - ID: {ticket.id}, Title: {ticket.title}, Created by: {user_name} (ID: {ticket.user_id})")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    simulate_api_filtering() 