import sqlite3

try:
    # Connect to database
    conn = sqlite3.connect('helpdesk.db')
    cursor = conn.cursor()

    print("Connected to database successfully")

    # Check if notifications table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='notifications'")
    table_exists = cursor.fetchone()
    
    if not table_exists:
        print("❌ Notifications table does not exist")
        exit(1)
    
    print("✅ Notifications table exists")

    # Check current notification URLs
    cursor.execute("SELECT id, title, action_url, ticket_id FROM notifications ORDER BY id DESC LIMIT 10")
    notifications = cursor.fetchall()

    print(f"\nFound {len(notifications)} recent notifications:")
    for notif in notifications:
        print(f"  ID {notif[0]}: {notif[1]}")
        print(f"    action_url: '{notif[2]}'")
        print(f"    ticket_id: {notif[3]}")
        print()

    # Count different URL patterns
    cursor.execute("SELECT COUNT(*) FROM notifications WHERE action_url LIKE '/tickets/%'")
    tickets_count = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM notifications WHERE action_url LIKE '/admin/tickets/%'")
    admin_count = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM notifications WHERE action_url LIKE '/dashboard/tickets/%'")
    dashboard_count = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM notifications")
    total_count = cursor.fetchone()[0]

    print(f"URL pattern counts (total: {total_count}):")
    print(f"  /tickets/%: {tickets_count}")
    print(f"  /admin/tickets/%: {admin_count}")
    print(f"  /dashboard/tickets/%: {dashboard_count}")

    conn.close()

except Exception as e:
    print(f"❌ Error: {e}") 