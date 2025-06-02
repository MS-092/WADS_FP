// MongoDB Initialization Script for Help Desk Application
// This script creates a dedicated user for the help desk database

// Switch to the e2425-wads-l4acg6 database
db = db.getSiblingDB('e2425-wads-l4acg6');

// Create a dedicated user for the help desk application
db.createUser({
  user: 'e2425-wads-l4acg6',
  pwd: 'hoch22uc',
  roles: [
    {
      role: 'readWrite',
      db: 'e2425-wads-l4acg6'
    },
    {
      role: 'dbAdmin',
      db: 'e2425-wads-l4acg6'
    }
  ]
});

// Create initial collections with indexes for better performance
// Users collection
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "_id": 1, "is_active": 1 });
db.users.createIndex({ "role": 1 });

// Tickets collection
db.tickets.createIndex({ "status": 1, "priority": 1 });
db.tickets.createIndex({ "assigned_to": 1, "status": 1 });
db.tickets.createIndex({ "created_by": 1 });
db.tickets.createIndex({ "created_at": -1 });
db.tickets.createIndex({ "updated_at": -1 });

// Messages collection (for chat)
db.messages.createIndex({ "ticket_id": 1, "created_at": -1 });
db.messages.createIndex({ "sender_id": 1 });

// Notifications collection
db.notifications.createIndex({ "user_id": 1, "read": 1, "created_at": -1 });

print('Help Desk Database initialized successfully!');
print('Created user: e2425-wads-l4acg6');
print('Database: e2425-wads-l4acg6');
print('Created indexes for optimal performance'); 