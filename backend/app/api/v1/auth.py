from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db, get_redis
from app.core.auth import verify_password, get_password_hash, create_token_response, verify_token
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserResponse
from app.schemas.auth import Token, TokenRefresh
import redis

router = APIRouter()

@router.options("/register")
def register_options():
    """
    Handle OPTIONS request for register endpoint
    """
    return Response(
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
    )

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """
    Register a new user
    """
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        email=user_data.email,
        password_hash=hashed_password,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        role=user_data.role
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

@router.post("/login", response_model=Token)
def login(
    user_credentials: UserLogin,
    db: Session = Depends(get_db)
):
    """
    User login with email and password
    """
    # Find user by email
    user = db.query(User).filter(User.email == user_credentials.email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Verify password
    if not verify_password(user_credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account"
        )
    
    # Update last active timestamp
    from datetime import datetime
    user.last_active = datetime.utcnow()
    db.commit()
    
    # Prepare user data for response
    user_data = {
        "id": user.id,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "role": user.role.value,
        "is_active": user.is_active,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "updated_at": user.updated_at.isoformat() if user.updated_at else None,
        "last_active": user.last_active.isoformat() if user.last_active else None
    }
    
    # Create and return tokens with user data
    return create_token_response(user.id, user_data)

@router.post("/refresh", response_model=Token)
def refresh_token(
    token_data: TokenRefresh,
    db: Session = Depends(get_db),
    redis_client: Optional[redis.Redis] = Depends(get_redis)
):
    """
    Refresh access token using refresh token
    """
    # Verify refresh token
    user_id = verify_token(token_data.refresh_token, token_type="refresh")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    # Check if refresh token is blacklisted (only if Redis is available)
    if redis_client:
        try:
            if redis_client.get(f"blacklist_refresh_{token_data.refresh_token}"):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token has been revoked"
                )
        except Exception:
            # Redis error, continue without blacklist check
            pass
    
    # Get user
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    # Blacklist old refresh token (only if Redis is available)
    if redis_client:
        try:
            redis_client.setex(
                f"blacklist_refresh_{token_data.refresh_token}",
                60 * 60 * 24 * 7,  # 7 days
                "revoked"
            )
        except Exception:
            # Redis error, continue without blacklisting
            pass
    
    # Prepare user data for response
    user_data = {
        "id": user.id,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "role": user.role.value,
        "is_active": user.is_active,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "updated_at": user.updated_at.isoformat() if user.updated_at else None,
        "last_active": user.last_active.isoformat() if user.last_active else None
    }
    
    # Create new token pair with user data
    return create_token_response(user.id, user_data)

@router.post("/logout")
def logout(
    token_data: TokenRefresh,
    current_user: User = Depends(get_current_user),
    redis_client: Optional[redis.Redis] = Depends(get_redis)
):
    """
    Logout user by blacklisting refresh token
    """
    # Blacklist refresh token (only if Redis is available)
    if redis_client:
        try:
            redis_client.setex(
                f"blacklist_refresh_{token_data.refresh_token}",
                60 * 60 * 24 * 7,  # 7 days
                "revoked"
            )
        except Exception:
            # Redis error, continue without blacklisting
            pass
    
    return {"message": "Successfully logged out"}

@router.get("/me", response_model=UserResponse)
def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    Get current user information
    """
    return current_user

@router.get("/verify-token")
def verify_token_endpoint(
    current_user: User = Depends(get_current_user)
):
    """
    Verify if the current token is valid
    """
    return {
        "valid": True,
        "user_id": current_user.id,
        "email": current_user.email,
        "role": current_user.role.value
    } 