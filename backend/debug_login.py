from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.auth import verify_password
from app.models.user import User

# Get database session
db = next(get_db())

print("Testing login logic...")

# Find user by email
email = "admin@helpdesk.com"
password = "admin123"

user = db.query(User).filter(User.email == email).first()

if not user:
    print(f"❌ User not found: {email}")
else:
    print(f"✅ User found: {user.email}")
    print(f"   ID: {user.id}")
    print(f"   Name: {user.first_name} {user.last_name}")
    print(f"   Role: {user.role}")
    print(f"   Active: {user.is_active}")
    print(f"   Password hash: {user.password_hash}")
    
    # Test password verification
    is_valid = verify_password(password, user.password_hash)
    print(f"   Password verification: {is_valid}")
    
    if not user.is_active:
        print("❌ User is not active")
    else:
        print("✅ User is active")

db.close() 