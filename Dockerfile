# Multi-stage Dockerfile for Full-Stack Help Desk Application
# Frontend: Next.js with TypeScript
# Backend: FastAPI with Python

# ================================
# Stage 1: Build Frontend (Next.js)
# ================================
FROM node:18-alpine AS frontend-build

WORKDIR /app/frontend

# Copy package files and install dependencies
COPY frontend/package*.json ./
COPY frontend/pnpm-lock.yaml* ./

# Install dependencies using npm (fallback to npm if pnpm not available)
RUN npm ci --only=production

# Copy frontend source code
COPY frontend/ ./

# Build the Next.js application
RUN npm run build

# ================================
# Stage 2: Build Backend Dependencies
# ================================
FROM python:3.11-slim AS backend-deps

WORKDIR /app/backend

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libffi-dev \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ================================
# Stage 3: Production Runtime
# ================================
FROM python:3.11-slim AS production

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser

WORKDIR /app

# Copy Python dependencies from build stage
COPY --from=backend-deps /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=backend-deps /usr/local/bin /usr/local/bin

# Copy built frontend assets
COPY --from=frontend-build /app/frontend/.next /app/frontend/.next
COPY --from=frontend-build /app/frontend/public /app/frontend/public
COPY --from=frontend-build /app/frontend/package.json /app/frontend/package.json
COPY --from=frontend-build /app/frontend/node_modules /app/frontend/node_modules

# Copy backend application
COPY backend/ /app/backend/

# Create uploads directory and set permissions
RUN mkdir -p /app/backend/uploads && \
    chown -R appuser:appuser /app && \
    chmod -R 755 /app/backend/uploads

# Switch to non-root user
USER appuser

# Expose ports
EXPOSE 8000 3000

# Set environment variables
ENV PYTHONPATH=/app/backend
ENV NODE_ENV=production
ENV UPLOAD_DIR=/app/backend/uploads

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

# Default command runs both services using a simple process manager approach
# In production, consider using supervisor or docker-compose for better service management
CMD ["sh", "-c", "cd /app/frontend && npm start & cd /app/backend && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --workers 1"]

# ================================
# Development Stage (optional)
# ================================
FROM node:18-alpine AS development

WORKDIR /app

# Install Python
RUN apk add --no-cache python3 py3-pip gcc musl-dev libffi-dev

# Copy application files
COPY . .

# Install frontend dependencies
WORKDIR /app/frontend
RUN npm install

# Install backend dependencies
WORKDIR /app/backend
RUN pip install -r requirements.txt

WORKDIR /app

# Development command
CMD ["sh", "-c", "cd frontend && npm run dev & cd backend && python main.py"] 