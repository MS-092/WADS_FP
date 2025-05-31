from sqlalchemy import create_engine, text

engine = create_engine('sqlite:///./helpdesk.db')
with engine.connect() as conn:
    result = conn.execute(text('SELECT id, email, first_name, last_name, role, is_active FROM users'))
    print('Users in database:')
    for row in result:
        print(f'ID: {row.id}, Email: {row.email}, Name: {row.first_name} {row.last_name}, Role: {row.role}, Active: {row.is_active}') 