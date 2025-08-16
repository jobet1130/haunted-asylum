import type { ApiResponse, GameStats, SaveGame, MultiplayerSession, Player } from '@/types';

// Enhanced error types
interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: Record<string, unknown>;
}

interface GameEvent {
  id: string;
  type: string;
  playerId: string;
  timestamp: number;
  data?: Record<string, unknown>;
}

// Base API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const API_TIMEOUT = 10000; // 10 seconds

// Safe localStorage access for SSR compatibility
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value);
    }
  },
  removeItem: (key: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
  }
};

// Request configuration interface
interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  data?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
}

// Enhanced fetch-based API client
class ApiClient {
  private baseURL: string;
  private timeout: number;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL: string, timeout: number = 10000) {
    this.baseURL = baseURL;
    this.timeout = timeout;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(config: RequestConfig): Promise<ApiResponse<T>> {
    const { method = 'GET', url, data, headers = {}, timeout = this.timeout } = config;
    
    // Request interceptor logic
    const token = safeLocalStorage.getItem('authToken');
    const requestHeaders = {
      ...this.defaultHeaders,
      ...headers,
      ...(token && { Authorization: `Bearer ${token}` }),
      'X-Request-ID': `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    };

    console.log(`[API Request] ${method} ${url}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${this.baseURL}${url}`, {
        method,
        headers: requestHeaders,
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log(`[API Response] ${response.status} ${url}`);

      const responseData = await response.json();

      if (!response.ok) {
        console.error('[API Response Error]', responseData);
        
        // Create proper ApiError object
        const apiError: ApiError = {
          message: responseData.message || `HTTP ${response.status}`,
          code: responseData.code,
          status: response.status,
          details: responseData.details || responseData
        };
        
        return {
          success: false,
          error: apiError.message,
          message: apiError.message,
        };
      }

      return {
        success: true,
        data: responseData.data || responseData,
        message: responseData.message || 'Request successful'
      };
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      
      // Create proper ApiError for network/fetch errors
      const fetchError = error as Error;
      const apiError: ApiError = {
        message: fetchError.message || 'Network error',
        code: 'NETWORK_ERROR',
        status: 0,
        details: { originalError: fetchError.name }
      };
      
      console.error('[API Request Error]', apiError);
      
      return {
        success: false,
        error: apiError.message,
        message: apiError.message,
      };
    }
  }

  // HTTP method helpers
  get<T>(url: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'GET', url, headers });
  }

  post<T>(url: string, data?: unknown, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'POST', url, data, headers });
  }

  put<T>(url: string, data?: unknown, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'PUT', url, data, headers });
  }

  patch<T>(url: string, data?: unknown, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'PATCH', url, data, headers });
  }

  delete<T>(url: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'DELETE', url, headers });
  }
}

// Create API client instance
const apiClient = new ApiClient(API_BASE_URL, API_TIMEOUT);

// Generic API request function
export async function apiRequest<T = unknown>(
  config: RequestConfig
): Promise<ApiResponse<T>> {
  const { method = 'GET', url, data, headers } = config;
  if (method === 'GET') return apiClient.get<T>(url, headers);
  if (method === 'POST') return apiClient.post<T>(url, data, headers);
  if (method === 'PUT') return apiClient.put<T>(url, data, headers);
  if (method === 'PATCH') return apiClient.patch<T>(url, data, headers);
  return apiClient.delete<T>(url, headers);
}

// Enhanced fetch-based alternative (kept for compatibility)
export async function fetchRequest<T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const token = safeLocalStorage.getItem('authToken');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}`);
    }

    return {
      success: true,
      data,
      message: data.message || 'Request successful'
    };
  } catch (error: unknown) {
    const fetchError = error as Error;
    return {
      success: false,
      error: fetchError.message,
      message: fetchError.message,
    };
  }
}

// Game-specific API endpoints with proper typing
export const gameApi = {
  // Player management
  player: {
    create: (playerData: Partial<Player>) =>
      apiClient.post<Player>('/players', playerData),
    
    get: (playerId: string) =>
      apiClient.get<Player>(`/players/${playerId}`),
    
    update: (playerId: string, updates: Partial<Player>) =>
      apiClient.patch<Player>(`/players/${playerId}`, updates),
    
    delete: (playerId: string) =>
      apiClient.delete<void>(`/players/${playerId}`),
  },

  // Save game management
  saves: {
    list: (playerId: string) =>
      apiClient.get<SaveGame[]>(`/players/${playerId}/saves`),
    
    create: (playerId: string, saveData: Omit<SaveGame, 'id'>) =>
      apiClient.post<SaveGame>(`/players/${playerId}/saves`, saveData),
    
    get: (playerId: string, saveId: string) =>
      apiClient.get<SaveGame>(`/players/${playerId}/saves/${saveId}`),
    
    update: (playerId: string, saveId: string, updates: Partial<SaveGame>) =>
      apiClient.patch<SaveGame>(`/players/${playerId}/saves/${saveId}`, updates),
    
    delete: (playerId: string, saveId: string) =>
      apiClient.delete<void>(`/players/${playerId}/saves/${saveId}`),
  },

  // Game statistics
  stats: {
    get: (playerId: string) =>
      apiClient.get<GameStats>(`/players/${playerId}/stats`),
    
    update: (playerId: string, stats: Partial<GameStats>) =>
      apiClient.patch<GameStats>(`/players/${playerId}/stats`, stats),
    
    leaderboard: (limit: number = 10) =>
      apiClient.get<Array<{ player: Player; stats: GameStats }>>(`/stats/leaderboard?limit=${limit}`),
  },

  // Multiplayer sessions
  multiplayer: {
    createSession: (sessionData: Omit<MultiplayerSession, 'id'>) =>
      apiClient.post<MultiplayerSession>('/multiplayer/sessions', sessionData),
    
    joinSession: (sessionId: string, playerId: string) =>
      apiClient.post<MultiplayerSession>(`/multiplayer/sessions/${sessionId}/join`, { playerId }),
    
    leaveSession: (sessionId: string, playerId: string) =>
      apiClient.post<MultiplayerSession>(`/multiplayer/sessions/${sessionId}/leave`, { playerId }),
    
    getSession: (sessionId: string) =>
      apiClient.get<MultiplayerSession>(`/multiplayer/sessions/${sessionId}`),
    
    listSessions: () =>
      apiClient.get<MultiplayerSession[]>('/multiplayer/sessions'),
  },

  // Game events and analytics
  events: {
    track: (eventData: {
      type: string;
      playerId: string;
      data?: Record<string, unknown>;
    }) =>
      apiClient.post<void>('/events/track', eventData),
    
    getPlayerEvents: (playerId: string, limit: number = 50) =>
      apiClient.get<GameEvent[]>(`/events/player/${playerId}?limit=${limit}`),
  },

  // Authentication
  auth: {
    login: (credentials: { username: string; password: string }) =>
      apiClient.post<{ token: string; player: Player }>('/auth/login', credentials),
    
    register: (userData: {
      username: string;
      password: string;
      email: string;
    }) =>
      apiClient.post<{ token: string; player: Player }>('/auth/register', userData),
    
    logout: () =>
      apiClient.post<void>('/auth/logout'),
    
    refreshToken: () =>
      apiClient.post<{ token: string }>('/auth/refresh'),
  },
};

// Enhanced utility functions
export const apiUtils = {
  // Set authentication token
  setAuthToken: (token: string): void => {
    safeLocalStorage.setItem('authToken', token);
  },

  // Clear authentication token
  clearAuthToken: (): void => {
    safeLocalStorage.removeItem('authToken');
  },

  // Get current auth token
  getAuthToken: (): string | null => {
    return safeLocalStorage.getItem('authToken');
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!safeLocalStorage.getItem('authToken');
  },

  // Handle API errors consistently with proper ApiError typing
  handleApiError: (error: unknown, fallbackMessage = 'An error occurred'): ApiError => {
    // Handle ApiResponse errors
    if (typeof error === 'object' && error !== null && 'error' in error) {
      const apiResponse = error as ApiResponse<unknown>;
      return {
        message: apiResponse.error || fallbackMessage,
        code: 'API_ERROR'
      };
    }
    
    // Handle fetch/network errors
    if (error instanceof Error) {
      return {
        message: error.message,
        code: 'NETWORK_ERROR',
        details: { name: error.name }
      };
    }
    
    // Handle unknown errors
    return {
      message: fallbackMessage,
      code: 'UNKNOWN_ERROR',
      details: { originalError: error }
    };
  },

  // Get error message from ApiError
  getErrorMessage: (apiError: ApiError): string => {
    return apiError.message;
  },

  // Check if error is a specific type
  isNetworkError: (apiError: ApiError): boolean => {
    return apiError.code === 'NETWORK_ERROR';
  },

  // Check if error is authentication related
  isAuthError: (apiError: ApiError): boolean => {
    return apiError.status === 401 || apiError.code === 'AUTH_ERROR';
  },

  // Enhanced retry mechanism with proper ApiError typing
  retryRequest: async <T>(
    requestFn: () => Promise<ApiResponse<T>>,
    maxRetries = 3,
    delay = 1000
  ): Promise<ApiResponse<T>> => {
    let lastError: ApiError = {
      message: 'Unknown error',
      code: 'UNKNOWN_ERROR'
    };
    
    for (let i = 0; i <= maxRetries; i++) {
      try {
        const result = await requestFn();
        if (result.success) {
          return result;
        }
        
        // Convert failed response to ApiError
        lastError = {
          message: result.error || result.message || 'Request failed',
          code: 'REQUEST_FAILED'
        };
      } catch (error: unknown) {
        lastError = apiUtils.handleApiError(error);
      }
      
      if (i < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
    
    return {
      success: false,
      error: lastError.message,
      message: lastError.message
    };
  },

  // Create standardized error response from ApiError
  createErrorResponse: <T>(apiError: ApiError): ApiResponse<T> => {
    return {
      success: false,
      error: apiError.message,
      message: apiError.message
    };
  },

  // Validate API response structure
  validateResponse: <T>(response: unknown): response is ApiResponse<T> => {
    return (
      typeof response === 'object' &&
      response !== null &&
      'success' in response &&
      typeof (response as ApiResponse<T>).success === 'boolean'
    );
  },

  // Create standardized error response
  createStandardErrorResponse: <T>(message: string, error?: string): ApiResponse<T> => {
    return {
      success: false,
      error: error || message,
      message
    };
  }
};

// Export the API client for direct use if needed
export { apiClient };

// Export default API object
export default gameApi;