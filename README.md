# Help Desk Pro - Full Stack Application

A modern help desk and ticketing system built with **Next.js frontend** and **FastAPI backend**, featuring real-time chat, authentication, and comprehensive ticket management.

## 🚀 Features

### ✅ **Phase 1 - Core Functionality**
- **Authentication System**: JWT-based login/registration
- **User Management**: Role-based access control (Customer, Admin)
- **Ticket System**: Create, view, update, and manage support tickets
- **Dashboard**: Real-time statistics and ticket overview

### ✅ **Phase 2 - Advanced Features**
- **Real-time Chat**: WebSocket-powered live messaging
- **File Uploads**: Attach files to tickets and messages
- **Notifications**: Live notification system
- **Admin Panel**: Comprehensive admin dashboard

## 🏗️ Architecture

### Frontend (Next.js + TypeScript)
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: React Context for authentication
- **Real-time**: WebSocket integration for chat and notifications
- **API Client**: Custom HTTP client with error handling

### Backend (FastAPI + Python)
- **Framework**: FastAPI with automatic OpenAPI documentation
- **Database**: SQLite with SQLAlchemy ORM
- **Authentication**: JWT tokens with refresh mechanism
- **Real-time**: WebSocket support for live features
- **File Storage**: Local file system with upload management

## 🛠️ Setup Instructions

### Prerequisites
- **Node.js** 18+ and npm/yarn
- **Python** 3.8+
- **Git**

### 1. Clone the Repository
```bash
git clone <repository-url>
cd WADS_FP
```

### 2. Backend Setup (FastAPI)

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the backend server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at:
- **API**: http://localhost:8000
- **Documentation**: http://localhost:8000/docs
- **WebSocket**: ws://localhost:8000/api/v1/ws

### 3. Frontend Setup (Next.js)

```bash
# Navigate to frontend directory (in a new terminal)
cd frontend

# Install dependencies
npm install

# Run the development server
npm run dev
```

The frontend will be available at: **http://localhost:3000**

### 4. Environment Variables (Optional)

Create a `.env.local` file in the frontend directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

## 📱 Usage

### Demo Accounts
The backend comes with demo data. You can register new accounts or use existing ones:

**For testing purposes, you can register any account or use the backend's demo data**

### Key Features to Test

1. **Authentication Flow**
   - Register a new account
   - Login with existing credentials
   - Automatic token refresh

2. **Ticket Management**
   - Create new tickets with different priorities
   - View ticket lists and details
   - Real-time status updates

3. **Live Chat**
   - Open the chat widget
   - Send messages in real-time
   - File uploads in chat
   - Connection status indicators

4. **Admin Features**
   - User management
   - Ticket assignment
   - System notifications

## 🔧 API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/refresh` - Refresh token

### Tickets
- `GET /api/v1/tickets/` - List tickets
- `POST /api/v1/tickets/` - Create ticket
- `GET /api/v1/tickets/{id}` - Get ticket details
- `PUT /api/v1/tickets/{id}` - Update ticket

### Chat & WebSocket
- `GET /api/v1/chat/{ticket_id}/messages` - Get chat messages
- `POST /api/v1/chat/{ticket_id}/messages` - Send message
- `WS /api/v1/ws` - WebSocket connection

### Files
- `POST /api/v1/files/upload` - Upload files

### Users & Admin
- `GET /api/v1/users/` - List users (admin)
- `GET /api/v1/notifications/` - Get notifications

## 🔒 Security Features

- **JWT Authentication** with access and refresh tokens
- **CORS Configuration** for cross-origin requests
- **Input Validation** using Pydantic models
- **Role-based Access Control** for different user types
- **Secure File Uploads** with type and size validation

## 🚀 Real-time Features

### WebSocket Integration
- **Live Chat**: Real-time messaging between users and admins
- **Connection Status**: Visual indicators for connection state
- **Auto-reconnection**: Automatic reconnection on connection loss
- **Message Persistence**: Chat history stored in database

### Notifications
- **Live Updates**: Real-time ticket status changes
- **System Alerts**: Important system notifications
- **User Mentions**: Notification when mentioned in chat

## 📁 Project Structure

```
WADS_FP/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/v1/         # API routes
│   │   ├── core/           # Core configuration
│   │   ├── models/         # Database models
│   │   └── schemas/        # Pydantic schemas
│   ├── requirements.txt    # Python dependencies
│   └── main.py            # Application entry point
└── frontend/               # Next.js frontend
    ├── app/               # App router pages
    ├── components/        # React components
    ├── lib/              # API client & utilities
    ├── hooks/            # Custom React hooks
    └── package.json      # Node dependencies
```

## 🐛 Troubleshooting

### Common Issues

1. **Backend won't start**
   - Check Python version (3.8+)
   - Ensure virtual environment is activated
   - Install dependencies: `pip install -r requirements.txt`

2. **Frontend API calls fail**
   - Verify backend is running on port 8000
   - Check CORS settings in backend
   - Confirm API URL in frontend configuration

3. **WebSocket connection fails**
   - Ensure both frontend and backend are running
   - Check authentication token is valid
   - Verify WebSocket URL configuration

4. **Database issues**
   - Delete `helpdesk.db` to reset database
   - Restart backend to recreate tables

## 🔄 Development Workflow

1. **Start Backend**: `uvicorn app.main:app --reload`
2. **Start Frontend**: `npm run dev`
3. **View API Docs**: http://localhost:8000/docs
4. **Test Frontend**: http://localhost:3000

## 📊 Monitoring & Debugging

- **Backend Logs**: Console output shows API requests and WebSocket connections
- **Frontend Console**: Browser dev tools for client-side debugging
- **Network Tab**: Monitor API calls and WebSocket messages
- **FastAPI Docs**: Interactive API testing at `/docs`

## 🎯 Next Steps

- [ ] Add email notifications
- [ ] Implement ticket templates
- [ ] Add search and filtering
- [ ] Create mobile app
- [ ] Add analytics dashboard
- [ ] Implement SLA tracking

---

**Built with ❤️ using FastAPI and Next.js** 