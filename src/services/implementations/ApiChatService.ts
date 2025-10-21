import type { ChatService } from '@/types';
import type {
  Conversation,
  CreateConversationRequest,
  UpdateConversationRequest,
  Message,
  SendMessageRequest,
  ExpertProfile,
  ExpertQueue,
  ExpertAssignment,
  UpdateExpertProfileRequest,
} from '@/types';
import TokenManager from '@/services/TokenManager';

interface ApiChatServiceConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
}

/**
 * API implementation of ChatService for production use
 * Uses fetch for HTTP requests
 */
export class ApiChatService implements ChatService {
  private baseUrl: string;
  private tokenManager: TokenManager;

  constructor(config: ApiChatServiceConfig) {
    this.baseUrl = config.baseUrl;
    this.tokenManager = TokenManager.getInstance();
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {

    // 1. Construct the full URL using this.baseUrl and endpoint
    const url = `${this.baseUrl}${endpoint}`;

    // 2. Get the token using this.tokenManager.getToken()
    const token = this.tokenManager.getToken();

    // 3. Set up default headers including 'Content-Type': 'application/json'
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // 4. Add Authorization header with Bearer token if token exists
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    // 5. Make the fetch request with the provided options
    const fetchOptions: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {}),
      },
      credentials: 'include',
    };

    // 6. Handle non-ok responses by throwing an error with status and message
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.errors?.join(', ') || errorMessage;
      } catch {
      }
      throw new Error(errorMessage);
    }

    // 7. Return the parsed JSON response
    const data: T = await response.json();
    return data;
  }

  // Conversations
  async getConversations(): Promise<Conversation[]> {

    // 1. Make a request to the appropriate endpoint
    const conversations = await this.makeRequest<Conversation[]>('/conversations', {
      method: 'GET',
    });

    // 2. Return the array of conversations
    return conversations;
  }

  async getConversation(_id: string): Promise<Conversation> {

    // 1. Make a request to the appropriate endpoint
    const conversation = await this.makeRequest<Conversation>(`/conversations/${_id}`, {
      method: 'GET',
    });
    
    // 2. Return the conversation object
    return conversation;
  }

  async createConversation(
    request: CreateConversationRequest
  ): Promise<Conversation> {

    // 1. Make a request to the appropriate endpoint
    const conversation = await this.makeRequest<Conversation>(
          '/conversations',
          {
            method: 'POST',
            body: JSON.stringify(request),
          }
        );

    // 2. Return the created conversation object
    return conversation;
  }

  async updateConversation(
    id: string,
    request: UpdateConversationRequest
  ): Promise<Conversation> {
    // SKIP, not currently used by application

    throw new Error('updateConversation method not implemented');
  }

  async deleteConversation(id: string): Promise<void> {
    // SKIP, not currently used by application

    throw new Error('deleteConversation method not implemented');
  }

  // Messages
  async getMessages(conversationId: string): Promise<Message[]> {

    // 1. Make a request to the appropriate endpoint
    const messages = await this.makeRequest<Message[]>(
      `/conversations/${conversationId}/messages`,
      {
        method: 'GET',
      }
    );

    // 2. Return the array of messages
    return messages;
  }

  async sendMessage(request: SendMessageRequest): Promise<Message> {

    // 1. Make a request to the appropriate endpoint
    const message = await this.makeRequest<Message>(
      '/messages',
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );

    // 2. Return the created message object
    return message;
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    // SKIP, not currently used by application

    throw new Error('markMessageAsRead method not implemented');
  }

  // Expert-specific operations
  async getExpertQueue(): Promise<ExpertQueue> {

    // 1. Make a request to the appropriate endpoint
    const expertQueue = await this.makeRequest<ExpertQueue>(
      '/expert/queue',
      {
        method: 'GET',
      }
    );

    // 2. Return the expert queue object with waitingConversations and assignedConversations
    return expertQueue;
  }

  async claimConversation(conversationId: string): Promise<void> {

    // 1. Make a request to the appropriate endpoint
    await this.makeRequest<ExpertQueue>(
      `/expert/conversations/${conversationId}/claim`,
      {
        method: 'POST',
      }
    );

    // 2. Return void (no response body expected)
  }

  async unclaimConversation(conversationId: string): Promise<void> {

    // 1. Make a request to the appropriate endpoint
    await this.makeRequest<ExpertQueue>(
      `/expert/conversations/${conversationId}/unclaim`,
      {
        method: 'POST',
      }
    );

    // 2. Return void (no response body expected)
  }

  async getExpertProfile(): Promise<ExpertProfile> {

    // 1. Make a request to the appropriate endpoint
    const expertProfile = await this.makeRequest<ExpertProfile>(
      '/expert/profile',
      {
        method: 'GET',
      }
    );

    // 2. Return the expert profile object
    return expertProfile;
  }

  async updateExpertProfile(
    request: UpdateExpertProfileRequest
  ): Promise<ExpertProfile> {

    // 1. Make a request to the appropriate endpoint
    const expertProfile = await this.makeRequest<ExpertProfile>(
      '/expert/profile',
      {
        method: 'PUT',
        body: JSON.stringify(request),
      }
    );

    // 2. Return the updated expert profile object
    return expertProfile;
  }

  async getExpertAssignmentHistory(): Promise<ExpertAssignment[]> {

    // 1. Make a request to the appropriate endpoint
    const assignmentHistory = await this.makeRequest<ExpertAssignment[]>(
      '/expert/assignments/history',
      {
        method: 'GET',
      }
    );

    // 2. Return the array of expert assignments
    return assignmentHistory;
  }
}
