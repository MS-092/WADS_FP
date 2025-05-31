from sqlalchemy import create_engine, text

engine = create_engine('sqlite:///./helpdesk.db')
with engine.connect() as conn:
    # Check table structure
    result = conn.execute(text("PRAGMA table_info(users)"))
    print("Users table schema:")
    for row in result:
        print(f"Column: {row[1]}, Type: {row[2]}, NotNull: {row[3]}, Default: {row[4]}, PK: {row[5]}")
    
    print("\n" + "="*50 + "\n")
    
    # Get all data from users table
    result = conn.execute(text('SELECT * FROM users'))
    columns = result.keys()
    print(f"All columns: {list(columns)}")
    
    print("\nActual user data:")
    for row in result:
        print(dict(row._mapping)) 