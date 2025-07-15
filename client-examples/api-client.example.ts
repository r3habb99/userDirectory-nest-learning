/**
 * TypeScript API Client Configuration Examples
 * For React, Vue, Angular, or any TypeScript frontend
 */

// API Configuration Interface
interface ApiConfig {
  baseURL: string;
  apiPrefix: string;
  timeout?: number;
  headers?: Record<string, string>;
}

// API Endpoints Interface
interface ApiEndpoints {
  auth: {
    login: string;
    register: string;
    profile: string;
    changePassword: string;
  };
  students: string;
  courses: string;
  attendance: string;
  idCards: string;
  upload: string;
}

// Environment Configuration
const API_CONFIG: Record<string, ApiConfig> = {
  development: {
    baseURL: 'http://localhost:3000',
    apiPrefix: '/api/v1',
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    }
  },
  production: {
    baseURL: 'https://your-production-domain.com',
    apiPrefix: '/api/v1',
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
    }
  }
};

// API Endpoints (without prefix)
const API_ENDPOINTS: ApiEndpoints = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    profile: '/auth/profile',
    changePassword: '/auth/change-password',
  },
  students: '/students',
  courses: '/courses',
  attendance: '/attendance',
  idCards: '/id-cards',
  upload: '/upload',
};

// Get current environment config
function getApiConfig(): ApiConfig {
  const env = process.env.NODE_ENV || 'development';
  return API_CONFIG[env] || API_CONFIG.development;
}

// Build full API URL
function buildApiUrl(endpoint: string): string {
  const config = getApiConfig();
  return `${config.baseURL}${config.apiPrefix}${endpoint}`;
}

// API Response Types
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  statusCode: number;
  error?: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

// API Client Class
class ApiClient {
  private config: ApiConfig;
  private token: string | null = null;

  constructor() {
    this.config = getApiConfig();
  }

  // Set authentication token
  setToken(token: string): void {
    this.token = token;
  }

  // Get headers with authentication
  private getHeaders(): Record<string, string> {
    const headers = { ...this.config.headers };
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    return headers;
  }

  // Generic request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = buildApiUrl(endpoint);
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API request failed: ${url}`, error);
      throw error;
    }
  }

  // Authentication methods
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await this.request<LoginResponse>(
      API_ENDPOINTS.auth.login,
      {
        method: 'POST',
        body: JSON.stringify(credentials),
      }
    );

    // Store token if login successful
    if (response.success && response.data?.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async register(userData: any): Promise<ApiResponse> {
    return this.request(API_ENDPOINTS.auth.register, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getProfile(): Promise<ApiResponse> {
    return this.request(API_ENDPOINTS.auth.profile, {
      method: 'GET',
    });
  }

  // Student methods
  async getStudents(): Promise<ApiResponse> {
    return this.request(API_ENDPOINTS.students, {
      method: 'GET',
    });
  }

  async createStudent(studentData: any): Promise<ApiResponse> {
    return this.request(API_ENDPOINTS.students, {
      method: 'POST',
      body: JSON.stringify(studentData),
    });
  }

  // Course methods
  async getCourses(): Promise<ApiResponse> {
    return this.request(API_ENDPOINTS.courses, {
      method: 'GET',
    });
  }

  // File upload method
  async uploadFile(file: File, category?: string): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (category) {
      formData.append('category', category);
    }

    return this.request(API_ENDPOINTS.upload, {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type for FormData, let browser set it
      },
    });
  }
}

// Create singleton instance
const apiClient = new ApiClient();

// Export for use in components
export {
  apiClient,
  ApiClient,
  buildApiUrl,
  getApiConfig,
  API_ENDPOINTS,
  type ApiResponse,
  type LoginRequest,
  type LoginResponse,
};

// Example usage in React component:
/*
import { apiClient } from './api-client';

const LoginComponent = () => {
  const handleLogin = async (email: string, password: string) => {
    try {
      const response = await apiClient.login({ email, password });
      if (response.success) {
        console.log('Login successful:', response.data);
        // Handle successful login
      }
    } catch (error) {
      console.error('Login failed:', error);
      // Handle login error
    }
  };

  return (
    // Your component JSX
  );
};
*/

// Example usage in Vue component:
/*
import { apiClient } from './api-client';

export default {
  methods: {
    async handleLogin(email, password) {
      try {
        const response = await apiClient.login({ email, password });
        if (response.success) {
          console.log('Login successful:', response.data);
          // Handle successful login
        }
      } catch (error) {
        console.error('Login failed:', error);
        // Handle login error
      }
    }
  }
};
*/
