// API configuration for Help Desk System Frontend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// API endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
    REFRESH: `${API_BASE_URL}/auth/refresh`,
    ME: `${API_BASE_URL}/auth/me`,
    CHANGE_PASSWORD: `${API_BASE_URL}/auth/change-password`,
  },
  
  // Tickets
  TICKETS: {
    LIST: `${API_BASE_URL}/tickets/`,
    CREATE: `${API_BASE_URL}/tickets/`,
    GET: (id) => `${API_BASE_URL}/tickets/${id}`,
    UPDATE: (id) => `${API_BASE_URL}/tickets/${id}`,
    DELETE: (id) => `${API_BASE_URL}/tickets/${id}`,
    ASSIGN: (id) => `${API_BASE_URL}/tickets/${id}/assign`,
    STATS: `${API_BASE_URL}/tickets/stats/overview`,
  },
  
  // Chat/Messages
  CHAT: {
    SEND_MESSAGE: `${API_BASE_URL}/chat/messages`,
    GET_MESSAGES: (ticketId) => `${API_BASE_URL}/chat/tickets/${ticketId}/messages`,
    GET_CONVERSATION: (ticketId) => `${API_BASE_URL}/chat/tickets/${ticketId}/conversation`,
    UPDATE_MESSAGE: (id) => `${API_BASE_URL}/chat/messages/${id}`,
    DELETE_MESSAGE: (id) => `${API_BASE_URL}/chat/messages/${id}`,
  },
  
  // Users
  USERS: {
    AGENTS: `${API_BASE_URL}/users/agents`,
    PROFILE: (id) => `${API_BASE_URL}/users/${id}`,
  },
  
  // Notifications
  NOTIFICATIONS: {
    LIST: `${API_BASE_URL}/notifications/`,
    GET: (id) => `${API_BASE_URL}/notifications/${id}`,
    MARK_READ: (id) => `${API_BASE_URL}/notifications/${id}/read`,
    MARK_ALL_READ: `${API_BASE_URL}/notifications/mark-all-read`,
    DELETE: (id) => `${API_BASE_URL}/notifications/${id}`,
    STATS: `${API_BASE_URL}/notifications/stats/overview`,
    // Admin notification endpoints
    ADMIN_ALL: `${API_BASE_URL}/notifications/admin/all`,
    ADMIN_MARK_READ: (id) => `${API_BASE_URL}/notifications/admin/${id}/read`,
    ADMIN_SYSTEM_ALERT: `${API_BASE_URL}/notifications/admin/system-alert`,
    ADMIN_SYSTEM_STATS: `${API_BASE_URL}/notifications/admin/stats/system`,
    ADMIN_CLEANUP: `${API_BASE_URL}/notifications/admin/cleanup`,
  },
  
  // Admin
  ADMIN: {
    USERS: `${API_BASE_URL}/admin/users`,
    USER: (id) => `${API_BASE_URL}/admin/users/${id}`,
    UPDATE_USER: (id) => `${API_BASE_URL}/admin/users/${id}`,
    UPDATE_USER_ROLE: (id) => `${API_BASE_URL}/admin/users/${id}/role`,
    UPDATE_USER_STATUS: (id) => `${API_BASE_URL}/admin/users/${id}/status`,
    DELETE_USER: (id) => `${API_BASE_URL}/admin/users/${id}`,
    SYSTEM_STATS: `${API_BASE_URL}/admin/stats/system`,
    
    // Admin ticket endpoints
    ALL_TICKETS: `${API_BASE_URL}/admin/tickets/all`,
    CREATE_TICKET: `${API_BASE_URL}/admin/tickets`,
    GET_TICKET: (id) => `${API_BASE_URL}/tickets/${id}`,
    UPDATE_TICKET: (id) => `${API_BASE_URL}/tickets/${id}`,
    ASSIGN_TICKET: (id) => `${API_BASE_URL}/tickets/${id}/assign`,
  },
  
  // File uploads
  UPLOADS: {
    AVATAR: `${API_BASE_URL}/uploads/avatar`,
    ATTACHMENT: `${API_BASE_URL}/uploads/attachment`,
  },
};

// API client class for making HTTP requests
class APIClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = null;
  }

  setToken(token) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  getToken() {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  async request(url, options = {}) {
    const token = this.getToken();
    
    // Debug logging
    console.log('Making API request to:', url);
    console.log('Token available:', !!token);
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      mode: 'cors',
      credentials: 'include',
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      console.log('Fetch config:', { url, method: config.method || 'GET', hasToken: !!token });
      
      // Add a timeout and better error handling for network issues
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(url, { 
        ...config, 
        signal: controller.signal 
      });
      
      clearTimeout(timeoutId);
      
      // Check if this is a public endpoint that shouldn't trigger login redirect
      const isPublicEndpoint = url.includes('/auth/register') || 
                               url.includes('/auth/login') || 
                               url.includes('/health') ||
                               url.includes('/api/docs');
      
      if (response.status === 401) {
        console.log('Authentication failed - clearing token');
        
        // Get the actual error message from the backend
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { detail: 'Authentication failed' };
        }

        // Only redirect to login if this is NOT a public endpoint
        if (!isPublicEndpoint) {
          this.clearToken();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        
        // For public endpoints (like login), use the actual backend error message
        if (isPublicEndpoint) {
          const errorMessage = errorData.detail || errorData.message || 'Authentication failed';
          throw new Error(errorMessage);
        } else {
          throw new Error('Authentication required');
        }
      }

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { detail: `HTTP error! status: ${response.status}` };
        }

        // Handle different error formats
        let errorMessage;
        if (errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            // Handle validation errors array
            errorMessage = errorData.detail
              .map(err => {
                if (typeof err === 'string') return err;
                if (err.msg) return `${err.loc?.join(' → ') || 'Field'}: ${err.msg}`;
                if (err.message) return err.message;
                return JSON.stringify(err);
              })
              .join('; ');
          } else if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          } else {
            errorMessage = JSON.stringify(errorData.detail);
          }
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else {
          errorMessage = `HTTP error! status: ${response.status}`;
        }

        throw new Error(errorMessage);
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return null;
    } catch (error) {
      console.error('API request failed:', error);
      console.error('Request details:', { url, method: config.method || 'GET', hasToken: !!token });
      
      // Provide more specific error messages
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        throw new Error('Network error: Unable to connect to server. Please check if the backend is running.');
      }
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout: The server took too long to respond.');
      }
      
      throw error;
    }
  }

  // HTTP methods
  async get(url, params = {}) {
    const urlWithParams = new URL(url);
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        urlWithParams.searchParams.append(key, params[key]);
      }
    });
    
    return this.request(urlWithParams.toString(), { method: 'GET' });
  }

  async post(url, data = {}) {
    return this.request(url, {
      method: 'POST',
      body: data,
    });
  }

  async put(url, data = {}) {
    return this.request(url, {
      method: 'PUT',
      body: data,
    });
  }

  async patch(url, data = {}) {
    return this.request(url, {
      method: 'PATCH',
      body: data,
    });
  }

  async delete(url) {
    return this.request(url, { method: 'DELETE' });
  }

  // Network test function
  async testConnection() {
    try {
      const healthUrl = `${this.baseURL.replace('/api', '')}/api/health`;
      console.log('Testing connection to:', healthUrl);
      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Backend server is reachable:', data);
        return { success: true, data };
      } else {
        console.error('Backend server responded with error:', response.status);
        return { success: false, error: `HTTP ${response.status}` };
      }
    } catch (error) {
      console.error('Backend server is not reachable:', error);
      return { success: false, error: error.message };
    }
  }

  // Debug method to test authenticated endpoints
  async testAuthenticatedEndpoint(endpoint = '/api/tickets') {
    try {
      console.log('Testing authenticated endpoint:', endpoint);
      const token = this.getToken();
      console.log('Using token:', token ? 'Present' : 'Missing');
      
      // Use the same URL construction as the main request method
      const fullUrl = endpoint.startsWith('http') ? endpoint : `${this.baseURL.replace('/api', '')}${endpoint}`;
      console.log('Full test URL:', fullUrl);
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        mode: 'cors',
        credentials: 'include',
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const data = await response.json();
        console.log('Endpoint response:', data);
        return { success: true, data };
      } else {
        const errorData = await response.text();
        console.error('Endpoint error:', errorData);
        return { success: false, error: `HTTP ${response.status}: ${errorData}` };
      }
    } catch (error) {
      console.error('Endpoint test failed:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create and export API client instance
export const apiClient = new APIClient();

// Authentication helpers
export const authAPI = {
  async login(email, password) {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, { email, password });
    if (response.access_token) {
      apiClient.setToken(response.access_token);
    }
    return response;
  },

  async register(userData) {
    return apiClient.post(API_ENDPOINTS.AUTH.REGISTER, userData);
  },

  async getCurrentUser() {
    return apiClient.get(API_ENDPOINTS.AUTH.ME);
  },

  async updateProfile(userData) {
    return apiClient.put(API_ENDPOINTS.AUTH.ME, userData);
  },

  async changePassword(passwordData) {
    return apiClient.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, passwordData);
  },

  logout() {
    apiClient.clearToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },
};

// Ticket helpers
export const ticketAPI = {
  async getTickets(params = {}) {
    return apiClient.get(API_ENDPOINTS.TICKETS.LIST, params);
  },

  async createTicket(ticketData) {
    return apiClient.post(API_ENDPOINTS.TICKETS.CREATE, ticketData);
  },

  async getTicket(id) {
    return apiClient.get(API_ENDPOINTS.TICKETS.GET(id));
  },

  async updateTicket(id, ticketData) {
    return apiClient.put(API_ENDPOINTS.TICKETS.UPDATE(id), ticketData);
  },

  async deleteTicket(id) {
    return apiClient.delete(API_ENDPOINTS.TICKETS.DELETE(id));
  },

  async assignTicket(id, agentId) {
    return apiClient.post(API_ENDPOINTS.TICKETS.ASSIGN(id), { assigned_to: agentId });
  },

  async getStats() {
    return apiClient.get(API_ENDPOINTS.TICKETS.STATS);
  },
};

// Chat helpers
export const chatAPI = {
  async sendMessage(ticketId, content) {
    return apiClient.post(API_ENDPOINTS.CHAT.SEND_MESSAGE, { 
      ticket_id: ticketId, 
      content: content,
      message_type: "text"
    });
  },

  async getMessages(ticketId, params = {}) {
    return apiClient.get(API_ENDPOINTS.CHAT.GET_MESSAGES(ticketId), params);
  },

  async getConversation(ticketId) {
    return apiClient.get(API_ENDPOINTS.CHAT.GET_CONVERSATION(ticketId));
  },

  async updateMessage(id, content) {
    return apiClient.put(API_ENDPOINTS.CHAT.UPDATE_MESSAGE(id), { content });
  },

  async deleteMessage(id) {
    return apiClient.delete(API_ENDPOINTS.CHAT.DELETE_MESSAGE(id));
  },
};

// Users helpers
export const usersAPI = {
  async getAgents() {
    return apiClient.get(API_ENDPOINTS.USERS.AGENTS);
  },

  async getProfile(id) {
    return apiClient.get(API_ENDPOINTS.USERS.PROFILE(id));
  },

  async getAllUsers(params = {}) {
    return apiClient.get(API_ENDPOINTS.ADMIN.USERS, params);
  },
};

// Notification helpers
export const notificationAPI = {
  async getNotifications(params = {}) {
    return apiClient.get(API_ENDPOINTS.NOTIFICATIONS.LIST, params);
  },

  async getNotification(id) {
    return apiClient.get(API_ENDPOINTS.NOTIFICATIONS.GET(id));
  },

  async markAsRead(id) {
    return apiClient.put(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id));
  },

  async markAllAsRead() {
    return apiClient.post(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
  },

  async deleteNotification(id) {
    return apiClient.delete(API_ENDPOINTS.NOTIFICATIONS.DELETE(id));
  },

  async getStats() {
    return apiClient.get(API_ENDPOINTS.NOTIFICATIONS.STATS);
  },

  // Admin notification methods
  async getAllNotificationsAdmin(params = {}) {
    return apiClient.get(API_ENDPOINTS.NOTIFICATIONS.ADMIN_ALL, params);
  },

  async markAsReadAdmin(id) {
    return apiClient.put(API_ENDPOINTS.NOTIFICATIONS.ADMIN_MARK_READ(id));
  },

  async createSystemAlert(data) {
    const { title, message, priority = 'high', target_roles = ['admin', 'agent'] } = data;
    
    // Build query string for the POST request with proper array handling
    const queryParams = new URLSearchParams();
    queryParams.append('title', title);
    queryParams.append('message', message);
    queryParams.append('priority', priority);
    
    // Add each target role as a separate parameter
    target_roles.forEach(role => {
      queryParams.append('target_roles', role);
    });
    
    return apiClient.post(`${API_ENDPOINTS.NOTIFICATIONS.ADMIN_SYSTEM_ALERT}?${queryParams}`);
  },

  async getSystemStats() {
    return apiClient.get(API_ENDPOINTS.NOTIFICATIONS.ADMIN_SYSTEM_STATS);
  },

  async cleanupOldNotifications(days_old = 30, dry_run = true) {
    return apiClient.delete(`${API_ENDPOINTS.NOTIFICATIONS.ADMIN_CLEANUP}?days_old=${days_old}&dry_run=${dry_run}`);
  },
};

// Admin helpers
export const adminAPI = {
  async getAllUsers(params = {}) {
    return apiClient.get(API_ENDPOINTS.ADMIN.USERS, params);
  },

  async getUser(id) {
    return apiClient.get(API_ENDPOINTS.ADMIN.USER(id));
  },

  async updateUser(id, userData) {
    return apiClient.put(API_ENDPOINTS.ADMIN.UPDATE_USER(id), userData);
  },

  async updateUserRole(id, role) {
    return apiClient.put(API_ENDPOINTS.ADMIN.UPDATE_USER_ROLE(id), { role });
  },

  async updateUserStatus(id, status) {
    return apiClient.put(API_ENDPOINTS.ADMIN.UPDATE_USER_STATUS(id), { status });
  },

  async deleteUser(id) {
    return apiClient.delete(API_ENDPOINTS.ADMIN.DELETE_USER(id));
  },

  async getSystemStats() {
    return apiClient.get(API_ENDPOINTS.ADMIN.SYSTEM_STATS);
  },

  async getAllTickets(params = {}) {
    return apiClient.get(API_ENDPOINTS.ADMIN.ALL_TICKETS, params);
  },

  // Individual ticket management for admin
  async getTicket(id) {
    return apiClient.get(API_ENDPOINTS.ADMIN.GET_TICKET(id));
  },

  async updateTicket(id, ticketData) {
    return apiClient.put(API_ENDPOINTS.ADMIN.UPDATE_TICKET(id), ticketData);
  },

  async assignTicket(id, agentId) {
    return apiClient.post(API_ENDPOINTS.ADMIN.ASSIGN_TICKET(id), { assigned_to: agentId });
  },

  async createTicket(ticketData) {
    const { created_by, ...ticketFields } = ticketData;
    const params = new URLSearchParams();
    params.append('user_id', created_by);
    
    return apiClient.post(`${API_ENDPOINTS.ADMIN.CREATE_TICKET}?${params}`, ticketFields);
  },
};

export default apiClient; 