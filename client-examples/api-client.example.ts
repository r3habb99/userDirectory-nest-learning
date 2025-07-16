/**
 * College Student Directory API - TypeScript Client Configuration
 * For React, Vue, Angular, or any TypeScript frontend
 *
 * This client is configured to work with the College Student Directory NestJS API
 * API Base: http://localhost:3000/api/v1
 */

// API Configuration Interface
interface ApiConfig {
  baseURL: string;
  apiPrefix: string;
  version: string;
  timeout?: number;
  headers?: Record<string, string>;
  frontendURL?: string;
}

// API Endpoints Interface - Structured to match your NestJS API
interface ApiEndpoints {
  auth: {
    login: string;
    register: string;
    profile: string;
    changePassword: string;
  };
  students: {
    base: string;
    search: string;
    statistics: string;
    byId: (id: string) => string;
  };
  courses: {
    base: string;
    statistics: string;
    byId: (id: string) => string;
  };
  attendance: {
    base: string;
    bulk: string;
    statistics: string;
    studentReport: (studentId: string) => string;
  };
  idCards: {
    base: string;
    byStudentId: (studentId: string) => string;
    byId: (id: string) => string;
  };
  admin: {
    base: string;
    statistics: string;
    byId: (id: string) => string;
  };
  upload: {
    profile: string;
    document: string;
    general: string;
  };
}

// Environment Configuration for College Student Directory
const API_CONFIG: Record<string, ApiConfig> = {
  development: {
    baseURL: 'http://localhost:3000',
    apiPrefix: '/api/v1',
    version: 'v1',
    frontendURL: 'http://localhost:3001',
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Version': 'v1',
    },
  },
  production: {
    baseURL: 'https://your-college-api-domain.com',
    apiPrefix: '/api/v1',
    version: 'v1',
    frontendURL: 'https://your-college-frontend-domain.com',
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Version': 'v1',
    },
  },
};

// API Endpoints (without prefix) - Matching your NestJS API structure
const API_ENDPOINTS: ApiEndpoints = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    profile: '/auth/profile',
    changePassword: '/auth/change-password',
  },
  students: {
    base: '/students',
    search: '/students/search',
    statistics: '/students/statistics',
    byId: (id: string) => `/students/${id}`,
  },
  courses: {
    base: '/courses',
    statistics: '/courses/statistics',
    byId: (id: string) => `/courses/${id}`,
  },
  attendance: {
    base: '/attendance',
    bulk: '/attendance/bulk',
    statistics: '/attendance/statistics',
    studentReport: (studentId: string) =>
      `/attendance/student/${studentId}/report`,
  },
  idCards: {
    base: '/id-cards',
    byStudentId: (studentId: string) => `/id-cards/student/${studentId}`,
    byId: (id: string) => `/id-cards/${id}`,
  },
  admin: {
    base: '/admin',
    statistics: '/admin/statistics',
    byId: (id: string) => `/admin/${id}`,
  },
  upload: {
    profile: '/upload/profile',
    document: '/upload/document',
    general: '/upload/general',
  },
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

// Helper function for dynamic endpoints
function buildDynamicUrl(
  endpointFunction: (id: string) => string,
  id: string,
): string {
  const endpoint = endpointFunction(id);
  return buildApiUrl(endpoint);
}

// Enhanced request headers with API versioning and tracking
function getRequestHeaders(includeAuth: boolean = true): HeadersInit {
  const config = getApiConfig();
  const headers: HeadersInit = {
    ...config.headers,
    'X-Request-ID': `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
  };

  if (includeAuth) {
    const token = localStorage.getItem('authToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
}

// Enhanced fetch wrapper with error handling and retries
async function apiRequest<T = any>(
  url: string,
  options: RequestInit = {},
  retries: number = 3,
): Promise<ApiResponse<T>> {
  const config = getApiConfig();

  const requestOptions: RequestInit = {
    ...options,
    headers: {
      ...getRequestHeaders(),
      ...options.headers,
    },
    signal: AbortSignal.timeout(config.timeout || 10000),
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, requestOptions);

      // Log response headers for debugging
      console.log('Response Headers:', {
        'X-API-Version': response.headers.get('X-API-Version'),
        'X-Request-ID': response.headers.get('X-Request-ID'),
        'X-Response-Time': response.headers.get('X-Response-Time'),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }

      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }

  throw new Error('Max retries exceeded');
}

// API Response Types - Matching your NestJS API response structure
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  statusCode: number;
  error?: string;
}

// Paginated Response Interface
interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Authentication Types
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  admin: {
    id: string;
    email: string;
    name: string;
    isActive: boolean;
  };
}

interface RegisterAdminRequest {
  name: string;
  email: string;
  password: string;
}

// Student Types
interface CreateStudentRequest {
  name: string;
  email: string;
  phone: string;
  address: string;
  age: number;
  courseId: string;
  admissionYear: number;
  passoutYear: number;
}

// Course Types
interface CreateCourseRequest {
  name: string;
  code: string;
  description?: string;
  duration: number;
  isActive?: boolean;
}

// Attendance Types
interface CreateAttendanceRequest {
  studentId: string;
  courseId: string;
  date: string; // YYYY-MM-DD format
  status: 'PRESENT' | 'ABSENT' | 'LATE';
}

// File Upload Types
interface FileUploadResponse {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  category: string;
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
    options: RequestInit = {},
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
        throw new Error(
          data.message || `HTTP error! status: ${response.status}`,
        );
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
      },
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
  async getStudents(page = 1, limit = 10): Promise<PaginatedResponse> {
    const url = `${API_ENDPOINTS.students.base}?page=${page}&limit=${limit}`;
    return this.request(url, {
      method: 'GET',
    }) as Promise<PaginatedResponse>;
  }

  async createStudent(studentData: CreateStudentRequest): Promise<ApiResponse> {
    return this.request(API_ENDPOINTS.students.base, {
      method: 'POST',
      body: JSON.stringify(studentData),
    });
  }

  async getStudentById(id: string): Promise<ApiResponse> {
    const endpoint = API_ENDPOINTS.students.byId(id);
    return this.request(endpoint, {
      method: 'GET',
    });
  }

  async searchStudents(query: string): Promise<ApiResponse> {
    const url = `${API_ENDPOINTS.students.search}?q=${encodeURIComponent(query)}`;
    return this.request(url, {
      method: 'GET',
    });
  }

  async getStudentStatistics(): Promise<ApiResponse> {
    return this.request(API_ENDPOINTS.students.statistics, {
      method: 'GET',
    });
  }

  // Course methods
  async getCourses(page = 1, limit = 10): Promise<PaginatedResponse> {
    const url = `${API_ENDPOINTS.courses.base}?page=${page}&limit=${limit}`;
    return this.request(url, {
      method: 'GET',
    }) as Promise<PaginatedResponse>;
  }

  async createCourse(courseData: CreateCourseRequest): Promise<ApiResponse> {
    return this.request(API_ENDPOINTS.courses.base, {
      method: 'POST',
      body: JSON.stringify(courseData),
    });
  }

  async getCourseById(id: string): Promise<ApiResponse> {
    const endpoint = API_ENDPOINTS.courses.byId(id);
    return this.request(endpoint, {
      method: 'GET',
    });
  }

  // Attendance methods
  async markAttendance(
    attendanceData: CreateAttendanceRequest,
  ): Promise<ApiResponse> {
    return this.request(API_ENDPOINTS.attendance.base, {
      method: 'POST',
      body: JSON.stringify(attendanceData),
    });
  }

  async getAttendanceReport(studentId: string): Promise<ApiResponse> {
    const endpoint = API_ENDPOINTS.attendance.studentReport(studentId);
    return this.request(endpoint, {
      method: 'GET',
    });
  }

  // ID Card methods
  async generateIdCard(studentId: string): Promise<ApiResponse> {
    return this.request(API_ENDPOINTS.idCards.base, {
      method: 'POST',
      body: JSON.stringify({ studentId }),
    });
  }

  async getIdCardByStudentId(studentId: string): Promise<ApiResponse> {
    const endpoint = API_ENDPOINTS.idCards.byStudentId(studentId);
    return this.request(endpoint, {
      method: 'GET',
    });
  }

  // File upload methods
  async uploadProfilePicture(
    file: File,
  ): Promise<ApiResponse<FileUploadResponse>> {
    const formData = new FormData();
    formData.append('file', file);

    return this.request(API_ENDPOINTS.upload.profile, {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type for FormData, let browser set it
      },
    });
  }

  async uploadDocument(file: File): Promise<ApiResponse<FileUploadResponse>> {
    const formData = new FormData();
    formData.append('file', file);

    return this.request(API_ENDPOINTS.upload.document, {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type for FormData, let browser set it
      },
    });
  }

  async uploadGeneralFile(
    file: File,
  ): Promise<ApiResponse<FileUploadResponse>> {
    const formData = new FormData();
    formData.append('file', file);

    return this.request(API_ENDPOINTS.upload.general, {
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

// Token Management Utility
class TokenManager {
  private static readonly TOKEN_KEY = 'college_auth_token';

  static setToken(token: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.TOKEN_KEY, token);
    }
  }

  static getToken(): string | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }

  static removeToken(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.TOKEN_KEY);
    }
  }

  static isTokenValid(token?: string): boolean {
    const authToken = token || this.getToken();
    if (!authToken) return false;

    try {
      const payload = JSON.parse(atob(authToken.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }
}

// Export for use in components
export {
  apiClient,
  ApiClient,
  TokenManager,
  buildApiUrl,
  buildDynamicUrl,
  getApiConfig,
  API_ENDPOINTS,
  type ApiResponse,
  type PaginatedResponse,
  type LoginRequest,
  type LoginResponse,
  type RegisterAdminRequest,
  type CreateStudentRequest,
  type CreateCourseRequest,
  type CreateAttendanceRequest,
  type FileUploadResponse,
};

/**
 * Example usage in React component:
 *
 * import React, { useState } from 'react';
 * import { apiClient, TokenManager, type LoginRequest, type CreateStudentRequest } from './api-client';
 *
 * const LoginComponent: React.FC = () => {
 *   const [loading, setLoading] = useState(false);
 *
 *   const handleLogin = async (email: string, password: string) => {
 *     setLoading(true);
 *     try {
 *       const credentials: LoginRequest = { email, password };
 *       const response = await apiClient.login(credentials);
 *
 *       if (response.success && response.data?.token) {
 *         TokenManager.setToken(response.data.token);
 *         apiClient.setToken(response.data.token);
 *         console.log('Login successful:', response.data);
 *         // Redirect to dashboard or update app state
 *       }
 *     } catch (error) {
 *       console.error('Login failed:', error);
 *       // Show error message to user
 *     } finally {
 *       setLoading(false);
 *     }
 *   };
 *
 *   const handleCreateStudent = async (studentData: CreateStudentRequest) => {
 *     try {
 *       const response = await apiClient.createStudent(studentData);
 *       if (response.success) {
 *         console.log('Student created:', response.data);
 *         // Refresh student list or navigate to student details
 *       }
 *     } catch (error) {
 *       console.error('Failed to create student:', error);
 *     }
 *   };
 *
 *   return (
 *     // Your login form JSX here
 *   );
 * };
 */

/**
 * Example usage in Vue 3 Composition API:
 *
 * import { ref } from 'vue';
 * import { apiClient, TokenManager, type LoginRequest } from './api-client';
 *
 * export default {
 *   setup() {
 *     const loading = ref(false);
 *     const students = ref([]);
 *
 *     const handleLogin = async (email: string, password: string) => {
 *       loading.value = true;
 *       try {
 *         const credentials: LoginRequest = { email, password };
 *         const response = await apiClient.login(credentials);
 *
 *         if (response.success && response.data?.token) {
 *           TokenManager.setToken(response.data.token);
 *           apiClient.setToken(response.data.token);
 *           console.log('Login successful:', response.data);
 *         }
 *       } catch (error) {
 *         console.error('Login failed:', error);
 *       } finally {
 *         loading.value = false;
 *       }
 *     };
 *
 *     const loadStudents = async () => {
 *       try {
 *         const response = await apiClient.getStudents(1, 20);
 *         if (response.success) {
 *           students.value = response.data;
 *           console.log('Pagination:', response.pagination);
 *         }
 *       } catch (error) {
 *         console.error('Failed to load students:', error);
 *       }
 *     };
 *
 *     return {
 *       loading,
 *       students,
 *       handleLogin,
 *       loadStudents
 *     };
 *   }
 * };
 */

/**
 * Example usage in Angular service:
 *
 * import { Injectable } from '@angular/core';
 * import { Observable, from } from 'rxjs';
 * import { apiClient, TokenManager, type ApiResponse, type LoginRequest } from './api-client';
 *
 * @Injectable({
 *   providedIn: 'root'
 * })
 * export class CollegeApiService {
 *
 *   login(credentials: LoginRequest): Observable<ApiResponse> {
 *     return from(apiClient.login(credentials).then(response => {
 *       if (response.success && response.data?.token) {
 *         TokenManager.setToken(response.data.token);
 *         apiClient.setToken(response.data.token);
 *       }
 *       return response;
 *     }));
 *   }
 *
 *   getStudents(page = 1, limit = 10): Observable<ApiResponse> {
 *     return from(apiClient.getStudents(page, limit));
 *   }
 *
 *   createStudent(studentData: CreateStudentRequest): Observable<ApiResponse> {
 *     return from(apiClient.createStudent(studentData));
 *   }
 *
 *   uploadProfilePicture(file: File): Observable<ApiResponse> {
 *     return from(apiClient.uploadProfilePicture(file));
 *   }
 * }
 */

/**
 * College Student Directory API - Summary & Best Practices:
 *
 * API Structure:
 * - Base URL: http://localhost:3000 (development)
 * - API Prefix: /api/v1
 * - Authentication: JWT Bearer tokens required for most endpoints
 * - Documentation: Available at http://localhost:3000/api/docs
 *
 * Key Features:
 * - Student Management: CRUD operations, search, statistics
 * - Course Management: CRUD operations, statistics
 * - Attendance Tracking: Mark attendance, bulk operations, reports
 * - ID Card Generation: Generate and retrieve student ID cards
 * - File Uploads: Profile pictures, documents, general files
 * - Admin Management: User management and statistics
 *
 * Response Format:
 * All API responses follow this structure:
 * {
 *   success: boolean,
 *   message: string,
 *   statusCode: number,
 *   data?: any,
 *   error?: string,
 *   pagination?: { page, limit, total, totalPages, hasNext, hasPrev } // For paginated responses
 * }
 *
 * Authentication Flow:
 * 1. Login with admin credentials
 * 2. Store JWT token using TokenManager
 * 3. Set token in ApiClient instance
 * 4. Use authenticated endpoints
 * 5. Handle token expiration and refresh as needed
 *
 * Error Handling:
 * - All methods throw errors that should be caught
 * - Check response.success before accessing response.data
 * - Use response.error for error messages
 * - Handle network errors and timeouts appropriately
 */
