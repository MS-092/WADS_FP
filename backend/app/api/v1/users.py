from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_admin_user
from app.models.user import User, UserRole
from app.schemas.user import UserResponse, UserUpdate, UserSummary
from datetime import datetime

router = APIRouter()

@router.get("/", response_model=List[UserResponse])
def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    role: Optional[UserRole] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get list of users (Admin only)
    """
    query = db.query(User)
    
    # Apply filters
    if role is not None:
        query = query.filter(User.role == role)
    
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    
    if search:
        search_term = f"%{search.lower()}%"
        query = query.filter(
            (User.first_name.ilike(search_term)) |
            (User.last_name.ilike(search_term)) |
            (User.email.ilike(search_term))
        )
    
    # Apply pagination
    users = query.offset(skip).limit(limit).all()
    return users

@router.get("/summary", response_model=List[UserSummary])
def get_users_summary(
    role: Optional[UserRole] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get lightweight user summary (for dropdowns, etc.)
    """
    query = db.query(User).filter(User.is_active == True)
    
    if role:
        query = query.filter(User.role == role)
    
    users = query.all()
    return users

@router.get("/me", response_model=UserResponse)
def get_my_profile(
    current_user: User = Depends(get_current_user)
):
    """
    Get current user's profile
    """
    return current_user

@router.put("/me", response_model=UserResponse)
def update_my_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update current user's profile
    """
    # Users can only update their own basic info
    update_data = user_update.dict(exclude_unset=True)
    
    # Remove fields users can't update themselves
    update_data.pop("role", None)
    update_data.pop("is_active", None)
    
    # Check if email is being changed and not already taken
    if "email" in update_data and update_data["email"] != current_user.email:
        existing_user = db.query(User).filter(
            User.email == update_data["email"],
            User.id != current_user.id
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
    
    # Apply updates
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)
    
    return current_user

@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user by ID
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Users can only view their own profile unless they're admin/agent
    if (current_user.id != user_id and 
        current_user.role not in [UserRole.ADMIN, UserRole.SUPPORT_AGENT]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this user"
        )
    
    return user

@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_update: UserUpdate,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    Update user by ID (Admin only)
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    update_data = user_update.dict(exclude_unset=True)
    
    # Check if email is being changed and not already taken
    if "email" in update_data and update_data["email"] != user.email:
        existing_user = db.query(User).filter(
            User.email == update_data["email"],
            User.id != user_id
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
    
    # Apply updates
    for field, value in update_data.items():
        setattr(user, field, value)
    
    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    
    return user

@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    Delete user by ID (Admin only)
    """
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Soft delete - just deactivate the user
    user.is_active = False
    user.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": f"User {user.email} has been deactivated"}

@router.put("/{user_id}/role")
def change_user_role(
    user_id: int,
    new_role: UserRole,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    Change user role (Admin only)
    """
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change your own role"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    old_role = user.role
    user.role = new_role
    user.updated_at = datetime.utcnow()
    db.commit()
    
    return {
        "message": f"User role changed from {old_role.value} to {new_role.value}",
        "user_id": user_id,
        "old_role": old_role.value,
        "new_role": new_role.value
    }

@router.get("/stats/summary")
def get_user_stats(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get user statistics (Admin only)
    """
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    customers = db.query(User).filter(User.role == UserRole.CUSTOMER).count()
    agents = db.query(User).filter(User.role == UserRole.SUPPORT_AGENT).count()
    admins = db.query(User).filter(User.role == UserRole.ADMIN).count()
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "inactive_users": total_users - active_users,
        "customers": customers,
        "support_agents": agents,
        "admins": admins
    } 