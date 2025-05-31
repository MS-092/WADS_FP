interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    // Get token from localStorage if available
    this.refreshTokenFromStorage();
  }

  refreshTokenFromStorage() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('access_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add Authorization header if token exists
    if (this.token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${this.token}`,
      };
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Handle FastAPI validation errors (422)
        if (response.status === 422 && data.detail && Array.isArray(data.detail)) {
          const errorMessages = data.detail.map((error: any) => {
            const field = error.loc ? error.loc.join('.') : '';
            return field ? `${field}: ${error.msg}` : error.msg;
          }).join(', ');
          throw new Error(errorMessages);
        }
        // Handle other error formats
        const errorMessage = data.detail || data.message || `HTTP error! status: ${response.status}`;
        throw new Error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
      }

      return { data };
    } catch (error) {
      console.error('API request failed:', error);
      let errorMessage = 'Unknown error';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        // Handle case where error might be an object
        if (error.message) {
          errorMessage = error.message;
        } else {
          errorMessage = JSON.stringify(error);
        }
      }
      
      return { error: errorMessage };
    }
  }

  // Authentication methods
  async login(email: string, password: string) {
    return this.request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
  }) {
    return this.request('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  logout() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  }

  setToken(token: string) {
    this.token = token;
  }

  async getCurrentUser() {
    return this.request('/api/v1/auth/me');
  }

  // Ticket methods
  async getTickets() {
    return this.request('/api/v1/tickets/');
  }

  async getTicket(id: string) {
    return this.request(`/api/v1/tickets/${id}`);
  }

  async createTicket(ticketData: {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
  }) {
    return this.request('/api/v1/tickets/', {
      method: 'POST',
      body: JSON.stringify(ticketData),
    });
  }

  async updateTicket(id: string, updates: any) {
    return this.request(`/api/v1/tickets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async assignTicket(ticketId: string, agentId: string | null) {
    const body = agentId ? { agent_id: parseInt(agentId) } : {};
    return this.request(`/api/v1/tickets/${ticketId}/assign`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async addComment(ticketId: string, commentData: {
    content: string;
    is_internal: boolean;
  }) {
    return this.request(`/api/v1/tickets/${ticketId}/comments`, {
      method: 'POST',
      body: JSON.stringify(commentData),
    });
  }

  // User methods
  async getUsers() {
    return this.request('/api/v1/users/');
  }

  async getUser(id: string) {
    return this.request(`/api/v1/users/${id}`);
  }

  async updateUser(id: string, userData: any) {
    return this.request(`/api/v1/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  // Chat methods
  async getChatMessages(ticketId: string) {
    return this.request(`/api/v1/chat/${ticketId}/messages`);
  }

  async sendChatMessage(ticketId: string, message: string) {
    return this.request(`/api/v1/chat/${ticketId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  // Chat room methods
  async getChatRooms() {
    return this.request('/api/v1/chat/rooms');
  }

  async getChatRoom(roomId: string) {
    return this.request(`/api/v1/chat/rooms/${roomId}`);
  }

  async getRoomMessages(roomId: string, skip = 0, limit = 50) {
    return this.request(`/api/v1/chat/rooms/${roomId}/messages?skip=${skip}&limit=${limit}`);
  }

  async sendRoomMessage(roomId: string, content: string, messageType = 'text') {
    return this.request(`/api/v1/chat/rooms/${roomId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, message_type: messageType }),
    });
  }

  async createChatRoom(roomData: {
    name: string;
    type: string;
    ticket_id?: number;
    participant_ids: number[];
  }) {
    return this.request('/api/v1/chat/rooms', {
      method: 'POST',
      body: JSON.stringify(roomData),
    });
  }

  // Notifications methods
  async getNotifications() {
    return this.request('/api/v1/notifications/');
  }

  async markNotificationAsRead(id: string) {
    return this.request(`/api/v1/notifications/${id}/read`, {
      method: 'PUT',
    });
  }

  // File upload
  async uploadFile(file: File, ticketId?: string) {
    const formData = new FormData();
    formData.append('file', file);
    if (ticketId) {
      formData.append('ticket_id', ticketId);
    }

    const config: RequestInit = {
      method: 'POST',
      body: formData,
      headers: {},
    };

    if (this.token) {
      config.headers = {
        Authorization: `Bearer ${this.token}`,
      };
    }

    try {
      const response = await fetch(`${this.baseURL}/api/v1/files/upload`, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Upload failed');
      }

      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Upload failed' };
    }
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

// Create a singleton instance
export const apiClient = new ApiClient();

// Helper function to get user from localStorage
export const getCurrentUserFromStorage = () => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
  return null;
};

// Helper function to check if user is authenticated
export const isAuthenticated = () => {
  if (typeof window !== 'undefined') {
    return !!localStorage.getItem('access_token');
  }
  return false;
}; 