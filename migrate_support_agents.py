#!/usr/bin/env python3
"""
Migration script to convert existing support agents to admins
"""
import sqlite3
from datetime import datetime

def migrate_support_agents():
    """
    Convert all support_agent users to admin role
    """
    try:
        # Connect to the SQLite database
        conn = sqlite3.connect('helpdesk.db')
        cursor = conn.cursor()
        
        # Check current support agents
        print("Checking for existing support agents...")
        cursor.execute("SELECT id, email, first_name, last_name FROM users WHERE role = 'SUPPORT_AGENT'")
        support_agents = cursor.fetchall()
        
        if not support_agents:
            print("✅ No support agents found to migrate")
            return
        
        print(f"Found {len(support_agents)} support agent(s) to migrate:")
        for agent in support_agents:
            print(f"  - {agent[1]} ({agent[2]} {agent[3]})")
        
        # Update support agents to admin role
        print("Updating support agents to admin role...")
        cursor.execute("""
            UPDATE users 
            SET role = 'ADMIN', updated_at = ? 
            WHERE role = 'SUPPORT_AGENT'
        """, (datetime.utcnow().isoformat(),))
        
        # Commit changes
        conn.commit()
        print("Changes committed to database")
        
        # Verify the migration
        cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'SUPPORT_AGENT'")
        remaining_agents = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'ADMIN'")
        total_admins = cursor.fetchone()[0]
        
        print(f"✅ Migration completed successfully!")
        print(f"   - Remaining support agents: {remaining_agents}")
        print(f"   - Total admins: {total_admins}")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()

if __name__ == "__main__":
    migrate_support_agents() 