import type {
  AuthService,
  RegisterRequest,
  User,
  AuthServiceConfig,
} from '@/types';
import TokenManager from '@/services/TokenManager';

/**
 * API-based implementation of AuthService
 * Uses fetch for HTTP requests
 */
export class ApiAuthService implements AuthService {
  private baseUrl: string;
  private tokenManager: TokenManager;

  constructor(config: AuthServiceConfig) {
    this.baseUrl = config.baseUrl || 'http://localhost:3000';
    this.tokenManager = TokenManager.getInstance();
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {

    // 1. Construct the full URL using this.baseUrl and endpoint
    const url = `${this.baseUrl}${endpoint}`;

    // 2. Set up default headers including 'Content-Type': 'application/json'
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // 3. Use {credentials: 'include'} for session cookies
    const fetchOptions: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {}),
      },
      credentials: 'include',
    };

    // 4. Make the fetch request with the provided options
    const response = await fetch(url, fetchOptions);

    // 5. Handle non-ok responses by throwing an error with status and message
    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.errors?.join(', ') || errorMessage;
      } catch {

      }
      throw new Error(errorMessage);
    }

    // 6. Return the parsed JSON response
    if (response.status === 204) {
      return {} as T;
    }
  
    const data: T = await response.json();
    return data;
  }


  async login(username: string, password: string): Promise<User> {

    // 1. Make a request to the appropriate endpoint
    const response = await this.makeRequest<{ user: User; token: string }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({
          user: {
            username,
            password,
          },
        }),
      }
    );

    // 2. Store the token using this.tokenManager.setToken(response.token)
    this.tokenManager.setToken(response.token);

    // 3. Return the user object
    return response.user;
  }


  // async register(userData: RegisterRequest): Promise<User> {

  //   // 1. Make a request to the appropriate endpoint
  //   const response = await this.makeRequest<{ user: User; token: string }>(
  //     '/auth/register',
  //     {
  //       method: 'POST',
  //       body: JSON.stringify(userData),
  //     }
  //   );
  
  //   // 2. Store the token using this.tokenManager.setToken(response.token)
  //   this.tokenManager.setToken(response.token);
    
  //   // 3. Return the user object
  //   return response.user;
  // }

  async register(userData: RegisterRequest): Promise<User> {
    const response = await this.makeRequest<{ user: User; token: string }>(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify({
          user: userData,
        }),
      }
    );
  
    this.tokenManager.setToken(response.token);
    return response.user;
  }


  async logout(): Promise<void> {

    try {

      // 1. Make a request to the appropriate endpoint
      await this.makeRequest<void>('/auth/logout', {
        method: 'POST',
      });

    } catch (error) {

      // 2. Handle errors gracefully (continue with logout even if API call fails)
      console.warn('Logout request failed:', error);

    } finally {

      // 3. Clear the token using this.tokenManager.clearToken()
      this.tokenManager.clearToken();

    }
  }


  async refreshToken(): Promise<User> {

    // 1. Make a request to the appropriate endpoint
    const response = await this.makeRequest<{ user: User; token: string }>(
      '/auth/refresh',
      {
        method: 'POST',
      }
    );
  
    // 3. Update the stored token using this.tokenManager.setToken(response.token)
    this.tokenManager.setToken(response.token);
    
    // 4. Return the user object
    return response.user;
  }


  async getCurrentUser(): Promise<User | null> {

    try {

      // 1. Make a request to the appropriate endpoint
      const user = await this.makeRequest<User>('/auth/me', {
        method: 'GET',
      });

      // 2. Return the user object if successful
      return user;

    } catch (error) {

      // 3. If the request fails (e.g., session invalid), clear the token and return null
      console.warn('Failed to get current user:', error);
      this.tokenManager.clearToken();
      return null;

    }
  }
}
