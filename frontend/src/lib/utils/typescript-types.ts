// API Response Types
export interface ApiResponse<T = any> {
  status: boolean;
  data: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
}

// Auth Types
export interface AuthResponse {
  token: string;
  user: User;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
  settings?: UserSettings;
  profile_image?: string;
}

// Conversation Types
export interface Conversation {
  id: string;
  title: string;
  summary?: string;
  model_id: string;
  created_at: string;
  updated_at: string;
  system_prompt?: string;
  is_pinned: boolean;
  is_archived: boolean;
  tags?: Tag[];
  message_count?: number;
  last_message?: {
    role: string;
    preview: string;
  };
  messages?: Message[];
}

export interface ConversationCreateRequest {
  title: string;
  model_id: string;
  system_prompt?: string;
  tags?: string[];
}

// Message Types
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  updated_at?: string;
  token_count?: number;
  metadata?: {
    token_usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
    };
    context_source?: string;
    context_documents?: string[];
    execution_time?: number;
  };
}

export interface MessageRequest {
  message: string;
  parameters?: any;
  stream?: boolean;
  files?: string[];
  context?: {
    web_search?: boolean;
    knowledge_ids?: string[];
  };
}

// Model Types
export interface Model {
  id: string;
  provider: string;
  name: string;
  display_name: string;
  context_length: number;
  available: boolean;
  description?: string;
  capabilities: {
    chat: boolean;
    function_calling: boolean;
    vision: boolean;
    embedding: boolean;
  };
  parameters: {
    [key: string]: ModelParameter;
  };
  usage_count?: number;
}

export interface ModelParameter {
  type: string;
  default: any;
  min?: any;
  max?: any;
  options?: any[];
  description?: string;
}

// Document Types
export interface Document {
  id: string;
  filename: string;
  title: string;
  content_type: string;
  size: number;
  created_at: string;
  embedding_status: 'pending' | 'processing' | 'completed' | 'error';
  chunks_count?: number;
  tags?: Tag[];
  metadata?: any;
  preview?: string;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  content: string;
  metadata: any;
}

// Tag Types
export interface Tag {
  id: string;
  name: string;
  color: string;
  count?: {
    conversations: number;
    documents: number;
  };
}

// Settings Types
export interface UserSettings {
  app: {
    theme: 'light' | 'dark' | 'system';
    default_locale?: string;
    message_display: 'compact' | 'comfortable';
  };
  models: {
    [modelId: string]: {
      temperature: number;
      max_tokens: number;
      [key: string]: any;
    };
  };
  features: {
    enable_web_search: boolean;
    enable_code_interpreter: boolean;
    enable_image_generation: boolean;
  };
}

// Socket Event Types
export interface SocketMessage {
  type: string;
  data: any;
}
