from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.auth import verify_password
from app.models.user import User
from app.schemas.user import UserLogin

def test_login_flow(email: str, password: str):
    """Test the exact same flow as the API endpoint"""
    print(f"🔍 Testing login flow for: {email}")
    print(f"🔑 Password: {password}")
    print("-" * 50)
    
    # Get database session
    db = next(get_db())
    
    try:
        # Step 1: Find user by email (same as API)
        print(f"1️⃣ Looking for user with email: {email}")
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            print(f"❌ User not found: {email}")
            return False
        
        print(f"✅ User found:")
        print(f"   - ID: {user.id}")
        print(f"   - Email: {user.email}")
        print(f"   - Name: {user.first_name} {user.last_name}")
        print(f"   - Role: {user.role}")
        print(f"   - Active: {user.is_active}")
        print(f"   - Password hash: {user.password_hash}")
        
        # Step 2: Verify password (same as API)
        print(f"\n2️⃣ Verifying password...")
        print(f"   - Plain password: '{password}'")
        print(f"   - Stored hash: {user.password_hash}")
        
        is_valid = verify_password(password, user.password_hash)
        print(f"   - Password verification result: {is_valid}")
        
        if not is_valid:
            print("❌ Password verification failed!")
            return False
        
        print("✅ Password verification successful!")
        
        # Step 3: Check if user is active (same as API)
        print(f"\n3️⃣ Checking if user is active...")
        if not user.is_active:
            print("❌ User is not active!")
            return False
        
        print("✅ User is active!")
        
        print(f"\n🎉 Login flow would succeed for {email}!")
        return True
        
    except Exception as e:
        print(f"❌ Error during login flow: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    # Test both users
    test_users = [
        ("admin@helpdesk.com", "admin123"),
        ("agent@helpdesk.com", "agent123"),
        ("agent@helpdesk.com", "admin123"),  # Try different password
    ]
    
    for email, password in test_users:
        test_login_flow(email, password)
        print("\n" + "="*70 + "\n") 