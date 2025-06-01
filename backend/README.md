# Help Desk Pro - Backend API

A complete help desk management system backend built with FastAPI, featuring authentication, ticket management, user roles, and ready for AI integration.

## 🚀 Features

### Phase 1 (Implemented)
- ✅ **Authentication System**: JWT tokens with refresh, role-based access
- ✅ **User Management**: CRUD operations, role management, profile updates
- ✅ **Ticket System**: Create, update, assign, comment on support tickets
- ✅ **Role-Based Security**: Customer, Admin roles
- ✅ **Database Models**: PostgreSQL with SQLAlchemy ORM
- ✅ **API Documentation**: Auto-generated with FastAPI/Swagger

### Coming Next
- 🔄 **Real-time Chat**: WebSocket communication
- 🤖 **AI Integration**: DeepSeek API for intelligent responses
- 📧 **Notifications**: Email and real-time push notifications
- 📊 **Analytics**: Dashboard metrics and reporting

## 🛠️ Tech Stack

- **Framework**: FastAPI 0.104+
- **Database**: PostgreSQL 15
- **Cache/Sessions**: Redis 7
- **Authentication**: JWT with refresh tokens
- **ORM**: SQLAlchemy 2.0 with Alembic migrations
- **Validation**: Pydantic schemas
- **Security**: bcrypt password hashing

## 📋 Prerequisites

- Python 3.11+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optional)

## ⚡ Quick Start

### Option 1: Docker Compose (Recommended)

1. **Clone and navigate to backend**:
   ```bash
   cd backend
   ```

2. **Start services**:
   ```bash
   # Start database and Redis only
   docker-compose up postgres redis -d
   
   # Or start everything including API
   docker-compose --profile full up -d
   ```

3. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

5. **Run the API**:
   ```bash
   python -m uvicorn app.main:app --reload
   ```

### Option 2: Manual Setup

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up PostgreSQL**:
   ```sql
   CREATE DATABASE helpdesk_db;
   CREATE USER helpdesk_user WITH PASSWORD 'helpdesk_password';
   GRANT ALL PRIVILEGES ON DATABASE helpdesk_db TO helpdesk_user;
   ```

3. **Set up Redis**:
   ```bash
   # Install and start Redis on your system
   redis-server
   ```

4. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your database and Redis URLs
   ```

5. **Initialize database with sample data**:
   ```bash
   python -m app.core.init_db
   ```

6. **Run the application**:
   ```bash
   python -m uvicorn app.main:app --reload
   ```

## 🔧 Configuration

Create a `.env` file in the backend directory:

```bash
# Database
DATABASE_URL=postgresql://helpdesk_user:helpdesk_password@localhost:5432/helpdesk_db

# JWT Settings
SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Redis
REDIS_URL=redis://localhost:6379/0

# CORS (for frontend)
BACKEND_CORS_ORIGINS=["http://localhost:3000", "http://localhost:3001"]
```

## 📚 API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## 👥 Sample Accounts

The system initializes with these test accounts:

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| Admin | admin@helpdesk.com | admin123 | Full system access |
| Admin | agent@helpdesk.com | agent123 | Full system access (migrated from agent) |
| Customer | john@example.com | customer123 | Regular customer |
| Customer | jane@example.com | customer123 | Regular customer |

## 🔐 API Endpoints

### Authentication
```
POST /api/v1/auth/register       # Register new user
POST /api/v1/auth/login          # Login with credentials
POST /api/v1/auth/refresh        # Refresh access token
POST /api/v1/auth/logout         # Logout (blacklist token)
GET  /api/v1/auth/me             # Get current user info
```

### Users
```
GET    /api/v1/users/            # List users (admin)
GET    /api/v1/users/me          # Get my profile
PUT    /api/v1/users/me          # Update my profile
GET    /api/v1/users/{id}        # Get user by ID
PUT    /api/v1/users/{id}        # Update user (admin)
DELETE /api/v1/users/{id}        # Delete user (admin)
```

### Tickets
```
GET    /api/v1/tickets/                    # List tickets
POST   /api/v1/tickets/                    # Create ticket
GET    /api/v1/tickets/{id}               # Get ticket details
PUT    /api/v1/tickets/{id}               # Update ticket
PUT    /api/v1/tickets/{id}/assign        # Assign to agent
POST   /api/v1/tickets/{id}/comments      # Add comment
GET    /api/v1/tickets/{id}/comments      # Get comments
GET    /api/v1/tickets/stats/summary      # Get statistics
```

## 🎯 Usage Examples

### 1. Register a new user
```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
     -H "Content-Type: application/json" \
     -d '{
       "email": "user@example.com",
       "password": "password123",
       "first_name": "John",
       "last_name": "Doe"
     }'
```

### 2. Login and get tokens
```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
     -H "Content-Type: application/json" \
     -d '{
       "email": "user@example.com",
       "password": "password123"
     }'
```

### 3. Create a ticket (authenticated)
```bash
curl -X POST "http://localhost:8000/api/v1/tickets/" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Website not loading",
       "description": "The main website is not loading properly",
       "priority": "high"
     }'
```

## 🗄️ Database Schema

### Users
- ID, email, password_hash, first_name, last_name
- role (customer/admin)
- timestamps, activity tracking

### Tickets
- ID, title, description, status, priority
- user_id (creator), assigned_to (agent)
- timestamps, resolution tracking

### Comments
- ID, content, is_internal (agent notes)
- ticket_id, user_id, timestamps

## 🔒 Security Features

- JWT access tokens (30 min expiry)
- JWT refresh tokens (7 day expiry)
- Token blacklisting on logout
- bcrypt password hashing
- Role-based access control
- Request rate limiting ready
- CORS configuration

## 🧪 Testing

```bash
# Run sample data initialization
python -m app.core.init_db

# Test API endpoints
curl http://localhost:8000/health
```

## 📈 Next Phases

### Phase 2: Real-time Features
- WebSocket chat system
- Live notifications
- File uploads

### Phase 3: AI Integration
- DeepSeek API integration
- Automated responses
- Sentiment analysis
- Smart ticket routing

### Phase 4: Advanced Features
- Email notifications
- Analytics dashboard
- Reporting system
- Performance monitoring

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**:
   ```bash
   # Check if PostgreSQL is running
   docker-compose ps postgres
   
   # Check logs
   docker-compose logs postgres
   ```

2. **Redis Connection Error**:
   ```bash
   # Check if Redis is running
   docker-compose ps redis
   ```

3. **Import Errors**:
   ```bash
   # Make sure you're in the backend directory
   cd backend
   
   # Run from the backend directory
   python -m app.main
   ```

## 📝 License

This project is part of the Help Desk Pro system for educational/development purposes.

---

**🚀 Ready for Phase 1! Start the server and visit http://localhost:8000/docs to explore the API.** 