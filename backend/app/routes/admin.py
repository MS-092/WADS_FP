"""
Admin routes for system management and user administration
"""

import math
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Depends, Query
from bson import ObjectId

from app.database.connection import get_database
from app.models.user import UserResponse, UserUpdate, UserRole, UserStatus, UserProfile
from app.models.ticket import TicketStats, TicketSummary, PaginatedTickets
from app.utils.auth import get_admin_user

router = APIRouter()


@router.get("/users", response_model=List[UserResponse])
async def get_all_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    role: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    current_user: UserResponse = Depends(get_admin_user)
):
    """Get all users with filtering and pagination (admin only)"""
    db = get_database()
    
    # Build query
    query = {}
    if role:
        query["role"] = role
    if status:
        query["status"] = status
    if search:
        query["$or"] = [
            {"full_name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"username": {"$regex": search, "$options": "i"}}
        ]
    
    # Calculate pagination
    skip = (page - 1) * per_page
    
    # Get users
    users_cursor = db.users.find(query).sort("created_at", -1).skip(skip).limit(per_page)
    
    users = []
    async for user in users_cursor:
        users.append(UserResponse(**user))
    
    return users


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user_by_id(
    user_id: str,
    current_user: UserResponse = Depends(get_admin_user)
):
    """Get user by ID (admin only)"""
    if not ObjectId.is_valid(user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    db = get_database()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse(**user)


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user_by_admin(
    user_id: str,
    user_update: UserUpdate,
    current_user: UserResponse = Depends(get_admin_user)
):
    """Update user by admin"""
    if not ObjectId.is_valid(user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    db = get_database()
    
    # Check if user exists
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prepare update data
    update_data = {k: v for k, v in user_update.dict().items() if v is not None}
    
    if not update_data:
        return UserResponse(**user)
    
    update_data["updated_at"] = datetime.utcnow()
    
    # Update user
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_data}
    )
    
    # Return updated user
    updated_user = await db.users.find_one({"_id": ObjectId(user_id)})
    return UserResponse(**updated_user)


@router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    role: UserRole,
    current_user: UserResponse = Depends(get_admin_user)
):
    """Update user role (admin only)"""
    if not ObjectId.is_valid(user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    db = get_database()
    
    result = await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {
            "$set": {
                "role": role,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {"message": f"User role updated to {role}"}


@router.put("/users/{user_id}/status")
async def update_user_status(
    user_id: str,
    status_update: UserStatus,
    current_user: UserResponse = Depends(get_admin_user)
):
    """Update user status (admin only)"""
    if not ObjectId.is_valid(user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    db = get_database()
    
    result = await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {
            "$set": {
                "status": status_update,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {"message": f"User status updated to {status_update}"}


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user: UserResponse = Depends(get_admin_user)
):
    """Delete user (admin only)"""
    if not ObjectId.is_valid(user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    # Prevent admin from deleting themselves
    if str(current_user.id) == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    db = get_database()
    
    result = await db.users.delete_one({"_id": ObjectId(user_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {"message": "User deleted successfully"}


@router.get("/stats/system")
async def get_system_stats(current_user: UserResponse = Depends(get_admin_user)):
    """Get system-wide statistics (admin only)"""
    db = get_database()
    
    # User statistics
    total_users = await db.users.count_documents({})
    active_users = await db.users.count_documents({"status": "active"})
    customers = await db.users.count_documents({"role": "customer"})
    agents = await db.users.count_documents({"role": "agent"})
    admins = await db.users.count_documents({"role": "admin"})
    
    # Ticket statistics
    total_tickets = await db.tickets.count_documents({})
    open_tickets = await db.tickets.count_documents({"status": "open"})
    resolved_tickets = await db.tickets.count_documents({"status": "resolved"})
    
    # Message statistics
    total_messages = await db.messages.count_documents({})
    
    # Recent activity (last 24 hours)
    from datetime import timedelta
    yesterday = datetime.utcnow() - timedelta(days=1)
    
    recent_tickets = await db.tickets.count_documents({"created_at": {"$gte": yesterday}})
    recent_messages = await db.messages.count_documents({"created_at": {"$gte": yesterday}})
    recent_users = await db.users.count_documents({"created_at": {"$gte": yesterday}})
    
    return {
        "users": {
            "total": total_users,
            "active": active_users,
            "customers": customers,
            "agents": agents,
            "admins": admins
        },
        "tickets": {
            "total": total_tickets,
            "open": open_tickets,
            "resolved": resolved_tickets
        },
        "messages": {
            "total": total_messages
        },
        "recent_activity": {
            "new_tickets_24h": recent_tickets,
            "new_messages_24h": recent_messages,
            "new_users_24h": recent_users
        }
    }


@router.get("/tickets/all", response_model=PaginatedTickets)
async def get_all_tickets_admin(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    current_user: UserResponse = Depends(get_admin_user)
):
    """Get all tickets in the system (admin only)"""
    db = get_database()
    
    # Calculate pagination
    skip = (page - 1) * per_page
    total = await db.tickets.count_documents({})
    pages = math.ceil(total / per_page)
    
    # Get tickets with user data
    pipeline = [
        {"$sort": {"created_at": -1}},
        {"$skip": skip},
        {"$limit": per_page},
        {
            "$lookup": {
                "from": "users",
                "localField": "created_by",
                "foreignField": "_id",
                "as": "created_by_user"
            }
        },
        {
            "$lookup": {
                "from": "users",
                "localField": "assigned_to",
                "foreignField": "_id",
                "as": "assigned_to_user"
            }
        }
    ]
    
    tickets_cursor = db.tickets.aggregate(pipeline)
    tickets = []
    
    async for ticket in tickets_cursor:
        # Format user profiles
        created_by_user = ticket["created_by_user"][0] if ticket["created_by_user"] else None
        assigned_to_user = ticket["assigned_to_user"][0] if ticket["assigned_to_user"] else None
        
        # Create UserProfile objects
        created_by = UserProfile(
            _id=str(created_by_user["_id"]),
            username=created_by_user["username"],
            full_name=created_by_user.get("full_name", ""),
            role=created_by_user["role"],
            department=created_by_user.get("department"),
            avatar_url=created_by_user.get("avatar_url")
        ) if created_by_user else None
        
        assigned_to = UserProfile(
            _id=str(assigned_to_user["_id"]),
            username=assigned_to_user["username"],
            full_name=assigned_to_user.get("full_name", ""),
            role=assigned_to_user["role"],
            department=assigned_to_user.get("department"),
            avatar_url=assigned_to_user.get("avatar_url")
        ) if assigned_to_user else None
        
        # Create TicketSummary object
        ticket_summary = TicketSummary(
            _id=str(ticket["_id"]),
            title=ticket["title"],
            category=ticket.get("category", "general"),
            priority=ticket.get("priority", "medium"),
            status=ticket["status"],
            created_by=created_by,
            assigned_to=assigned_to,
            created_at=ticket["created_at"],
            updated_at=ticket["updated_at"],
            message_count=ticket.get("message_count", 0)
        )
        
        tickets.append(ticket_summary)
    
    return PaginatedTickets(
        tickets=tickets,
        total=total,
        page=page,
        per_page=per_page,
        pages=pages,
        has_next=page < pages,
        has_prev=page > 1
    ) 