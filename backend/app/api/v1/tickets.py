from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_admin_user, get_agent_or_admin_user
from app.core.notifications import notification_service
from app.core.websocket import manager
from app.models.user import User, UserRole
from app.models.ticket import Ticket, Comment, TicketStatus, TicketPriority
from app.schemas.ticket import (
    TicketCreate, TicketUpdate, TicketResponse, TicketSummary, TicketStats,
    CommentCreate, CommentResponse
)

router = APIRouter()

@router.get("/", response_model=List[TicketSummary])
def list_tickets(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[TicketStatus] = None,
    priority: Optional[TicketPriority] = None,
    assigned_to: Optional[int] = None,
    user_id: Optional[int] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get list of tickets with filtering
    """
    query = db.query(Ticket).options(
        joinedload(Ticket.user),
        joinedload(Ticket.assigned_agent)
    )
    
    # Apply role-based filtering
    if current_user.role == UserRole.CUSTOMER:
        # Customers can only see their own tickets
        query = query.filter(Ticket.user_id == current_user.id)
    elif current_user.role == UserRole.SUPPORT_AGENT:
        # Agents can see tickets assigned to them or unassigned tickets
        query = query.filter(
            or_(
                Ticket.assigned_to == current_user.id,
                Ticket.assigned_to.is_(None)
            )
        )
    # Admins can see all tickets (no additional filter)
    
    # Apply filters
    if status is not None:
        query = query.filter(Ticket.status == status)
    
    if priority is not None:
        query = query.filter(Ticket.priority == priority)
    
    if assigned_to is not None:
        query = query.filter(Ticket.assigned_to == assigned_to)
    
    if user_id is not None and current_user.role in [UserRole.ADMIN, UserRole.SUPPORT_AGENT]:
        query = query.filter(Ticket.user_id == user_id)
    
    if search:
        search_term = f"%{search.lower()}%"
        query = query.filter(
            or_(
                Ticket.title.ilike(search_term),
                Ticket.description.ilike(search_term)
            )
        )
    
    # Order by creation date (newest first)
    query = query.order_by(Ticket.created_at.desc())
    
    # Apply pagination
    tickets = query.offset(skip).limit(limit).all()
    return tickets

@router.post("/", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
async def create_ticket(
    ticket_data: TicketCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new ticket
    """
    # Create new ticket
    db_ticket = Ticket(
        title=ticket_data.title,
        description=ticket_data.description,
        priority=ticket_data.priority,
        user_id=current_user.id,
        status=TicketStatus.OPEN
    )
    
    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)
    
    # Load relationships for response
    db_ticket = db.query(Ticket).options(
        joinedload(Ticket.user),
        joinedload(Ticket.assigned_agent),
        joinedload(Ticket.comments).joinedload(Comment.user),
        joinedload(Ticket.attachments)
    ).filter(Ticket.id == db_ticket.id).first()
    
    # Send notifications to agents/admins about new ticket
    try:
        await notification_service.notify_ticket_created(db, db_ticket)
        
        # Send real-time update
        ticket_data_dict = {
            "id": db_ticket.id,
            "title": db_ticket.title,
            "status": db_ticket.status.value,
            "priority": db_ticket.priority.value,
            "customer_name": db_ticket.user.full_name
        }
        await manager.send_ticket_update(
            db_ticket.id, 
            {"action": "created", "ticket": ticket_data_dict}, 
            exclude_user=current_user.id
        )
        
    except Exception as e:
        print(f"Error sending ticket creation notifications: {e}")
    
    return db_ticket

@router.get("/{ticket_id}", response_model=TicketResponse)
def get_ticket(
    ticket_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get ticket by ID
    """
    ticket = db.query(Ticket).options(
        joinedload(Ticket.user),
        joinedload(Ticket.assigned_agent),
        joinedload(Ticket.comments).joinedload(Comment.user),
        joinedload(Ticket.attachments)
    ).filter(Ticket.id == ticket_id).first()
    
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
    
    # Check permissions
    if (current_user.role == UserRole.CUSTOMER and 
        ticket.user_id != current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this ticket"
        )
    
    if (current_user.role == UserRole.SUPPORT_AGENT and 
        ticket.assigned_to != current_user.id and 
        ticket.assigned_to is not None):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this ticket"
        )
    
    return ticket

@router.put("/{ticket_id}", response_model=TicketResponse)
async def update_ticket(
    ticket_id: int,
    ticket_update: TicketUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update ticket
    """
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
    
    # Check permissions
    can_update = False
    
    if current_user.role == UserRole.ADMIN:
        can_update = True
    elif current_user.role == UserRole.SUPPORT_AGENT:
        # Agents can update tickets assigned to them or unassigned tickets
        can_update = (ticket.assigned_to == current_user.id or 
                     ticket.assigned_to is None)
    elif current_user.role == UserRole.CUSTOMER:
        # Customers can only update title/description of their own open tickets
        can_update = (ticket.user_id == current_user.id and 
                     ticket.status == TicketStatus.OPEN)
    
    if not can_update:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this ticket"
        )
    
    # Apply updates
    update_data = ticket_update.dict(exclude_unset=True)
    
    # Customers can only update basic fields
    if current_user.role == UserRole.CUSTOMER:
        allowed_fields = {"title", "description"}
        update_data = {k: v for k, v in update_data.items() if k in allowed_fields}
    
    # Track status changes for notifications
    old_status = ticket.status
    status_changed = False
    
    # Track status changes
    if "status" in update_data and update_data["status"] != ticket.status:
        status_changed = True
        if update_data["status"] == TicketStatus.RESOLVED:
            ticket.resolved_at = datetime.utcnow()
        elif ticket.status == TicketStatus.RESOLVED:
            ticket.resolved_at = None
    
    # Apply updates
    for field, value in update_data.items():
        setattr(ticket, field, value)
    
    ticket.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(ticket)
    
    # Send notifications for status changes
    try:
        if status_changed and ticket.status == TicketStatus.RESOLVED:
            await notification_service.notify_ticket_resolved(db, ticket, current_user)
        
        # Send real-time update
        ticket_data_dict = {
            "id": ticket.id,
            "title": ticket.title,
            "status": ticket.status.value,
            "priority": ticket.priority.value,
            "updated_fields": list(update_data.keys())
        }
        await manager.send_ticket_update(
            ticket.id, 
            {"action": "updated", "ticket": ticket_data_dict}, 
            exclude_user=current_user.id
        )
        
    except Exception as e:
        print(f"Error sending ticket update notifications: {e}")
    
    # Load relationships for response
    ticket = db.query(Ticket).options(
        joinedload(Ticket.user),
        joinedload(Ticket.assigned_agent),
        joinedload(Ticket.comments).joinedload(Comment.user),
        joinedload(Ticket.attachments)
    ).filter(Ticket.id == ticket_id).first()
    
    return ticket

@router.delete("/{ticket_id}")
def delete_ticket(
    ticket_id: int,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    Delete ticket (Admin only)
    """
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
    
    db.delete(ticket)
    db.commit()
    
    return {"message": f"Ticket #{ticket_id} has been deleted"}

@router.put("/{ticket_id}/assign")
async def assign_ticket(
    ticket_id: int,
    agent_id: Optional[int] = None,
    current_user: User = Depends(get_agent_or_admin_user),
    db: Session = Depends(get_db)
):
    """
    Assign ticket to an agent
    """
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
    
    # Get agent user object for notifications
    agent = None
    if agent_id is not None:
        agent = db.query(User).filter(
            User.id == agent_id,
            User.role.in_([UserRole.SUPPORT_AGENT, UserRole.ADMIN]),
            User.is_active == True
        ).first()
        
        if not agent:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid agent ID"
            )
    
    old_assignee = ticket.assigned_to
    ticket.assigned_to = agent_id
    ticket.updated_at = datetime.utcnow()
    
    # If assigning for the first time, change status to in_progress
    if old_assignee is None and agent_id is not None:
        ticket.status = TicketStatus.IN_PROGRESS
    
    db.commit()
    
    # Send notifications
    try:
        if agent:
            await notification_service.notify_ticket_assigned(db, ticket, agent, current_user)
        
        # Send real-time update
        assignment_data = {
            "id": ticket.id,
            "assigned_to": agent_id,
            "assigned_to_name": agent.full_name if agent else None,
            "assigned_by": current_user.full_name
        }
        await manager.send_ticket_update(
            ticket.id, 
            {"action": "assigned", "ticket": assignment_data}, 
            exclude_user=current_user.id
        )
        
    except Exception as e:
        print(f"Error sending assignment notifications: {e}")
    
    return {
        "message": f"Ticket #{ticket_id} assignment updated",
        "ticket_id": ticket_id,
        "assigned_to": agent_id,
        "previous_assignee": old_assignee
    }

@router.post("/{ticket_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def add_comment(
    ticket_id: int,
    comment_data: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Add comment to ticket
    """
    # Check if ticket exists and user has permission
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
    
    # Check permissions
    can_comment = False
    
    if current_user.role == UserRole.ADMIN:
        can_comment = True
    elif current_user.role == UserRole.SUPPORT_AGENT:
        can_comment = (ticket.assigned_to == current_user.id or 
                      ticket.assigned_to is None)
    elif current_user.role == UserRole.CUSTOMER:
        can_comment = ticket.user_id == current_user.id
    
    if not can_comment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to comment on this ticket"
        )
    
    # Only agents/admins can create internal comments
    is_internal = comment_data.is_internal
    if is_internal and current_user.role == UserRole.CUSTOMER:
        is_internal = False
    
    # Create comment
    db_comment = Comment(
        content=comment_data.content,
        is_internal=is_internal,
        ticket_id=ticket_id,
        user_id=current_user.id
    )
    
    db.add(db_comment)
    
    # Update ticket's updated_at timestamp
    ticket.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_comment)
    
    # Load user relationship for response
    db_comment = db.query(Comment).options(
        joinedload(Comment.user)
    ).filter(Comment.id == db_comment.id).first()
    
    # Send notifications
    try:
        if not is_internal:  # Don't notify about internal comments
            await notification_service.notify_comment_added(db, db_comment, ticket)
        
        # Send real-time update
        comment_data_dict = {
            "id": db_comment.id,
            "content": db_comment.content,
            "user_name": db_comment.user.full_name,
            "is_internal": db_comment.is_internal,
            "created_at": db_comment.created_at.isoformat()
        }
        await manager.send_ticket_update(
            ticket_id, 
            {"action": "comment_added", "comment": comment_data_dict}, 
            exclude_user=current_user.id
        )
        
    except Exception as e:
        print(f"Error sending comment notifications: {e}")
    
    return db_comment

@router.get("/{ticket_id}/comments", response_model=List[CommentResponse])
def get_ticket_comments(
    ticket_id: int,
    include_internal: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get comments for a ticket
    """
    # Check if ticket exists and user has permission
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
    
    # Check permissions (same as get_ticket)
    if (current_user.role == UserRole.CUSTOMER and 
        ticket.user_id != current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this ticket"
        )
    
    query = db.query(Comment).options(
        joinedload(Comment.user)
    ).filter(Comment.ticket_id == ticket_id)
    
    # Filter internal comments for customers
    if current_user.role == UserRole.CUSTOMER or not include_internal:
        query = query.filter(Comment.is_internal == False)
    
    comments = query.order_by(Comment.created_at.asc()).all()
    return comments

@router.get("/stats/summary", response_model=TicketStats)
def get_ticket_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get ticket statistics
    """
    base_query = db.query(Ticket)
    
    # Apply role-based filtering
    if current_user.role == UserRole.CUSTOMER:
        base_query = base_query.filter(Ticket.user_id == current_user.id)
    elif current_user.role == UserRole.SUPPORT_AGENT:
        base_query = base_query.filter(
            or_(
                Ticket.assigned_to == current_user.id,
                Ticket.assigned_to.is_(None)
            )
        )
    
    # Get counts
    total = base_query.count()
    open_count = base_query.filter(Ticket.status == TicketStatus.OPEN).count()
    in_progress = base_query.filter(Ticket.status == TicketStatus.IN_PROGRESS).count()
    resolved = base_query.filter(Ticket.status == TicketStatus.RESOLVED).count()
    closed = base_query.filter(Ticket.status == TicketStatus.CLOSED).count()
    
    high_priority = base_query.filter(Ticket.priority == TicketPriority.HIGH).count()
    medium_priority = base_query.filter(Ticket.priority == TicketPriority.MEDIUM).count()
    low_priority = base_query.filter(Ticket.priority == TicketPriority.LOW).count()
    
    return TicketStats(
        total=total,
        open=open_count,
        in_progress=in_progress,
        resolved=resolved,
        closed=closed,
        high_priority=high_priority,
        medium_priority=medium_priority,
        low_priority=low_priority
    ) 