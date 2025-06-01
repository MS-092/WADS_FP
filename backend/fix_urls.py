import sqlite3

# Connect to database
conn = sqlite3.connect('helpdesk.db')
cursor = conn.cursor()

# Update all notification URLs from /tickets/ to /admin/tickets/
cursor.execute("UPDATE notifications SET action_url = '/admin/tickets/' || ticket_id WHERE action_url LIKE '/tickets/%'")

print(f'Updated {cursor.rowcount} notifications')

# Commit changes
conn.commit()
conn.close()

print('✅ All notification URLs have been fixed!') 