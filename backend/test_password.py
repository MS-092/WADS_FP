from sqlalchemy import create_engine, text
from passlib.context import CryptContext

# Initialize password context (same as in the app)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

engine = create_engine('sqlite:///./helpdesk.db')
with engine.connect() as conn:
    result = conn.execute(text('SELECT email, password_hash FROM users WHERE email = "admin@helpdesk.com"'))
    user = result.fetchone()
    
    if user:
        print(f"Admin user found: {user.email}")
        print(f"Stored hash: {user.password_hash}")
        
        # Test password verification
        test_password = "admin123"
        is_valid = pwd_context.verify(test_password, user.password_hash)
        print(f"Password '{test_password}' verification: {is_valid}")
        
        # Also test what the hash should be
        new_hash = pwd_context.hash(test_password)
        print(f"New hash for '{test_password}': {new_hash}")
    else:
        print("Admin user not found!") 