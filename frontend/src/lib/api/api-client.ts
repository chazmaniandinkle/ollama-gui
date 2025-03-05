import axios from 'axios';
import type { 
  AuthResponse, 
  ApiResponse, 
  Conversation, 
  ConversationCreateRequest, 
  Model, 
  MessageRequest,
  Tag,
  UserSettings
} from '$lib/types';
import { socket } from './websocket';

// Create axios instance
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add auth token to requests if available
axiosInstance.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
axiosInstance.interceptors.response.use(
  response => response,
  error => {
    // Handle 401 responses (unauthorized)
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

class ApiClient {
  // Auth endpoints
  async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await axiosInstance.post('/auth/login', { email, password });
      const token = response.data.data.token;
      localStorage.setItem('auth_token', token);
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async register(name: string, email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await axiosInstance.post('/auth/register', { name, email, password });
      const token = response.data.data.token;
      localStorage.setItem('auth_token', token);
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async getUserProfile(): Promise<ApiResponse<any>> {
    try {
      const response = await axiosInstance.get('/auth/me');
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async logout(): Promise<void> {
    localStorage.removeItem('auth_token');
  }

  // Conversation endpoints
  async getConversations(): Promise<ApiResponse<{ conversations: Conversation[] }>> {
    try {
      const response = await axiosInstance.get('/conversations');
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async getConversation(id: string): Promise<ApiResponse<Conversation>> {
    try {
      const response = await axiosInstance.get(`/conversations/${id}`);
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async createConversation(data: ConversationCreateRequest): Promise<ApiResponse<Conversation>> {
    try {
      const response = await axiosInstance.post('/conversations', data);
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async updateConversation(id: string, data: Partial<Conversation>): Promise<ApiResponse<Conversation>> {
    try {
      const response = await axiosInstance.patch(`/conversations/${id}`, data);
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async deleteConversation(id: string, permanent: boolean = false): Promise<ApiResponse<any>> {
    try {
      const response = await axiosInstance.delete(`/conversations/${id}?permanent=${permanent}`);
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  // Chat endpoints
  async sendChatMessage(conversationId: string, message: string, parameters?: any): Promise<ApiResponse<any>> {
    try {
      const response = await axiosInstance.post(`/chat/${conversationId}`, {
        message,
        parameters,
        stream: false
      });
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async streamChatResponse(
    conversationId: string, 
    message: string, 
    parameters?: any,
    onToken?: (token: string) => void,
    onComplete?: () => void
  ): Promise<string> {
    // Generate a unique socket ID for this streaming session
    const streamId = `stream-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Setup event listeners for this specific stream
    socket.on(`stream:${streamId}:token`, (data: { token: string }) => {
      if (onToken) onToken(data.token);
    });
    
    socket.on(`stream:${streamId}:done`, () => {
      // Remove listeners when done
      socket.off(`stream:${streamId}:token`);
      socket.off(`stream:${streamId}:done`);
      socket.off(`stream:${streamId}:error`);
      
      if (onComplete) onComplete();
    });
    
    socket.on(`stream:${streamId}:error`, (error: any) => {
      console.error('Streaming error:', error);
      // Remove listeners on error
      socket.off(`stream:${streamId}:token`);
      socket.off(`stream:${streamId}:done`);
      socket.off(`stream:${streamId}:error`);
      
      if (onComplete) onComplete();
    });
    
    // Send the request to start streaming
    socket.emit('chat:stream', {
      conversationId,
      message,
      parameters,
      streamId
    });
    
    return streamId;
  }

  // Model endpoints
  async getModels(): Promise<ApiResponse<{ models: Model[] }>> {
    try {
      const response = await axiosInstance.get('/models');
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async getModelDetails(id: string): Promise<ApiResponse<Model>> {
    try {
      const response = await axiosInstance.get(`/models/${id}`);
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async refreshModels(): Promise<ApiResponse<any>> {
    try {
      const response = await axiosInstance.post('/models/refresh');
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async updateModelParameters(id: string, parameters: any): Promise<ApiResponse<any>> {
    try {
      const response = await axiosInstance.patch(`/models/${id}/params`, parameters);
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  // Document endpoints
  async uploadDocument(file: File, title?: string, tags?: string[]): Promise<ApiResponse<any>> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (title) formData.append('title', title);
      if (tags) formData.append('tags', JSON.stringify(tags));

      const response = await axiosInstance.post('/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async getDocuments(): Promise<ApiResponse<any>> {
    try {
      const response = await axiosInstance.get('/documents');
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async getDocumentDetails(id: string): Promise<ApiResponse<any>> {
    try {
      const response = await axiosInstance.get(`/documents/${id}`);
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async deleteDocument(id: string): Promise<ApiResponse<any>> {
    try {
      const response = await axiosInstance.delete(`/documents/${id}`);
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  // Tag endpoints
  async getTags(): Promise<ApiResponse<{ tags: Tag[] }>> {
    try {
      const response = await axiosInstance.get('/tags');
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async createTag(name: string, color: string): Promise<ApiResponse<Tag>> {
    try {
      const response = await axiosInstance.post('/tags', { name, color });
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  // Settings endpoints
  async getSettings(): Promise<ApiResponse<UserSettings>> {
    try {
      const response = await axiosInstance.get('/settings');
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async updateSettings(settings: Partial<UserSettings>): Promise<ApiResponse<any>> {
    try {
      const response = await axiosInstance.patch('/settings', settings);
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  // Error handling
  private handleError(error: any): ApiResponse<any> {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    
    return {
      status: false,
      data: {},
      error: {
        code: 'unknown_error',
        message: error.message || 'An unknown error occurred'
      }
    };
  }
}

export const apiClient = new ApiClient();
