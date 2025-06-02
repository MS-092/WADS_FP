# Help Desk & Ticketing System

A comprehensive help desk and ticketing system with separate frontend (Next.js) and backend (FastAPI) components that are now fully integrated.

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 18+
- MongoDB (running locally or connection string)
- Redis (optional, for real-time features)

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables:**
   ```bash
   cp env_example.txt .env
   # Edit .env with your configuration
   ```

4. **Start the backend server:**
   ```bash
   python main.py
   ```
   The API will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```
   The frontend will be available at `http://localhost:3000`

## 🔗 Integration Status

✅ **FULLY INTEGRATED** - Frontend and backend are now connected!

### What's Connected:
- **Authentication**: Real login/register with JWT tokens
- **Ticket Management**: Create, read, update tickets via API
- **User Management**: User profiles and role-based access
- **Error Handling**: Proper API error handling and user feedback
- **State Management**: Authentication context and protected routes

### API Endpoints:
- Backend API: `http://localhost:8000/api`
- API Documentation: `http://localhost:8000/api/docs`
- Frontend: `http://localhost:3000`

## 🛠️ Features

### User Features:
- ✅ User registration and authentication
- ✅ Create and manage support tickets
- ✅ Real-time ticket updates
- ✅ File attachments
- ✅ Ticket filtering and search

### Admin Features:
- ✅ Admin dashboard with system overview
- ✅ User management
- ✅ Ticket assignment and management
- ✅ System statistics and analytics

### Technical Features:
- ✅ JWT-based authentication
- ✅ Role-based access control
- ✅ RESTful API design
- ✅ Real-time notifications
- ✅ File upload support
- ✅ Responsive UI with dark/light themes

## 🗂️ Project Structure

```
WADS_FP/
├── backend/           # FastAPI backend
│   ├── app/
│   │   ├── routes/    # API endpoints
│   │   ├── models/    # Database models
│   │   ├── database/  # Database configuration
│   │   └── utils/     # Utility functions
│   ├── main.py        # Application entry point
│   └── requirements.txt
│
├── frontend/          # Next.js frontend
│   ├── components/    # Reusable UI components
│   ├── lib/          # API client and utilities
│   ├── dashboard/    # Dashboard pages
│   ├── admin/        # Admin pages
│   ├── login/        # Authentication pages
│   └── package.json
│
└── README.md
```

## 🚦 Getting Started

1. **Start the backend first:**
   ```bash
   cd backend && python main.py
   ```

2. **Start the frontend:**
   ```bash
   cd frontend && npm run dev
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - API Docs: http://localhost:8000/api/docs

4. **Create an account or use demo credentials** (check backend routes for test users)

## 🔧 Configuration

### Backend Configuration (`backend/.env`):
```env
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=helpdesk_db
SECRET_KEY=your_secret_key
CORS_ORIGINS=["http://localhost:3000"]
```

### Frontend Configuration (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## 🧪 Testing the Integration

1. **Register a new user** at http://localhost:3000/register
2. **Login** at http://localhost:3000/login
3. **Create a ticket** in the dashboard
4. **Check the backend logs** to see API calls being made
5. **Verify data persistence** by refreshing the page

## 📝 API Documentation

Full API documentation is available at `http://localhost:8000/api/docs` when the backend is running.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please:
1. Check the documentation
2. Search existing issues
3. Create a new issue with detailed information
4. Contact the development team

## 🔮 Roadmap

- [ ] Real-time WebSocket connections
- [ ] Mobile app development
- [ ] Advanced reporting and analytics
- [ ] Integration with external tools (Slack, Microsoft Teams)
- [ ] Knowledge base functionality
- [ ] Multi-language support
- [ ] Advanced file management
- [ ] Video call integration

---

Built with ❤️ by the Help Desk System Team 