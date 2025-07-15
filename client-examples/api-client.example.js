/**
 * @fileoverview College Student Directory API Client Configuration Examples
 * @description This file shows how to properly configure API calls for the College Student Directory system
 * @author College Development Team
 * @version 1.0.0
 */

/**
 * College Student Directory API Client Configuration
 * This file shows how to properly configure API calls for the College Student Directory system
 * API Prefix: /api/v1 (as configured in your NestJS application)
 */

// ❌ INCORRECT - This will cause /api/v1/api/v1/auth/login
// This is intentionally unused - it's an example of what NOT to do
// eslint-disable-next-line no-unused-vars
const INCORRECT_CONFIG = {
  baseURL: 'http://localhost:3000/api/v1', // Don't include /api/v1 here
  endpoints: {
    login: '/api/v1/auth/login', // This adds another /api/v1
  }
};

// ✅ CORRECT - This will result in /api/v1/auth/login
const CORRECT_CONFIG = {
  baseURL: 'http://localhost:3000', // Base URL without /api/v1
  endpoints: {
    // Authentication endpoints
    login: '/api/v1/auth/login',
    register: '/api/v1/auth/register',
    profile: '/api/v1/auth/profile',
    changePassword: '/api/v1/auth/change-password',

    // Student management endpoints
    students: '/api/v1/students',
    studentSearch: '/api/v1/students/search',
    studentStatistics: '/api/v1/students/statistics',

    // Course management endpoints
    courses: '/api/v1/courses',
    courseStatistics: '/api/v1/courses/statistics',

    // Attendance endpoints
    attendance: '/api/v1/attendance',
    attendanceBulk: '/api/v1/attendance/bulk',
    attendanceStatistics: '/api/v1/attendance/statistics',

    // ID Card endpoints
    idCards: '/api/v1/id-cards',

    // Admin management endpoints
    admin: '/api/v1/admin',
    adminStatistics: '/api/v1/admin/statistics',

    // File upload endpoints
    uploadProfile: '/api/v1/upload/profile',
    uploadDocument: '/api/v1/upload/document',
    uploadGeneral: '/api/v1/upload/general',
  }
};

// Alternative approach - separate base and API prefix (Recommended)
const ALTERNATIVE_CONFIG = {
  baseURL: 'http://localhost:3000',
  apiPrefix: '/api/v1',
  endpoints: {
    // Authentication
    auth: {
      login: '/auth/login',
      register: '/auth/register',
      profile: '/auth/profile',
      changePassword: '/auth/change-password',
    },
    // Student management
    students: {
      base: '/students',
      search: '/students/search',
      statistics: '/students/statistics',
      byId: (id) => `/students/${id}`,
    },
    // Course management
    courses: {
      base: '/courses',
      statistics: '/courses/statistics',
      byId: (id) => `/courses/${id}`,
    },
    // Attendance
    attendance: {
      base: '/attendance',
      bulk: '/attendance/bulk',
      statistics: '/attendance/statistics',
      studentReport: (studentId) => `/attendance/student/${studentId}/report`,
    },
    // ID Cards
    idCards: {
      base: '/id-cards',
      byStudentId: (studentId) => `/id-cards/student/${studentId}`,
      byId: (id) => `/id-cards/${id}`,
    },
    // Admin management
    admin: {
      base: '/admin',
      statistics: '/admin/statistics',
      byId: (id) => `/admin/${id}`,
    },
    // File uploads
    upload: {
      profile: '/upload/profile',
      document: '/upload/document',
      general: '/upload/general',
    },
  }
};

// Helper function to build full URL
function buildApiUrl(endpoint) {
  return `${ALTERNATIVE_CONFIG.baseURL}${ALTERNATIVE_CONFIG.apiPrefix}${endpoint}`;
}

// Helper function to build URL with dynamic parameters
function buildDynamicUrl(endpointFunction, ...params) {
  const endpoint = endpointFunction(...params);
  return buildApiUrl(endpoint);
}

// Example usage with fetch - Admin Login
async function loginExample() {
  try {
    const response = await fetch(CORRECT_CONFIG.baseURL + CORRECT_CONFIG.endpoints.login, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@college.edu',
        password: 'Admin@123'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Login successful:', data);

    // Expected response structure:
    // {
    //   success: true,
    //   message: "Login successful",
    //   statusCode: 200,
    //   data: {
    //     token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    //     admin: {
    //       id: "clp1234567890abcdef",
    //       email: "admin@college.edu",
    //       name: "John Admin",
    //       isActive: true
    //     }
    //   }
    // }

    return data;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}

// Example usage with alternative config - Create Student
async function createStudentExample() {
  try {
    const url = buildApiUrl(ALTERNATIVE_CONFIG.endpoints.students.base);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE' // Required for protected endpoints
      },
      body: JSON.stringify({
        name: 'John Doe',
        email: 'john.doe@student.college.edu',
        phone: '+1234567890',
        address: '123 College Street, City, State 12345',
        age: 20,
        courseId: 'course-id-here',
        admissionYear: 2024,
        passoutYear: 2028
      })
    });

    const data = await response.json();
    console.log('Student created:', data);
    return data;
  } catch (error) {
    console.error('Student creation failed:', error);
    throw error;
  }
}

// Example: Get student by ID
async function getStudentExample(studentId) {
  try {
    const url = buildDynamicUrl(ALTERNATIVE_CONFIG.endpoints.students.byId, studentId);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE'
      }
    });

    const data = await response.json();
    console.log('Student data:', data);
    return data;
  } catch (error) {
    console.error('Failed to get student:', error);
    throw error;
  }
}

// Example with Axios (if using axios library)
const axiosConfig = {
  // ✅ CORRECT Axios configuration
  baseURL: 'http://localhost:3000', // No /api/v1 here
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
};

// Usage with axios - Login
async function axiosLoginExample() {
  const axios = require('axios'); // You need to install axios: npm install axios

  try {
    const response = await axios.post('/api/v1/auth/login', {
      email: 'admin@college.edu',
      password: 'Admin@123'
    }, {
      baseURL: axiosConfig.baseURL,
      timeout: axiosConfig.timeout,
      headers: axiosConfig.headers
    });

    console.log('Login successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    throw error;
  }
}

// Axios example - File upload (Profile picture)
async function axiosUploadProfileExample(file, token) {
  const axios = require('axios');

  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post('/api/v1/upload/profile', formData, {
      baseURL: axiosConfig.baseURL,
      timeout: 30000, // Longer timeout for file uploads
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type for FormData, let axios handle it
      }
    });

    console.log('Profile picture uploaded:', response.data);
    return response.data;
  } catch (error) {
    console.error('Upload failed:', error.response?.data || error.message);
    throw error;
  }
}

// Axios example - Get students with pagination
async function axiosGetStudentsExample(token, page = 1, limit = 10) {
  const axios = require('axios');

  try {
    const response = await axios.get('/api/v1/students', {
      baseURL: axiosConfig.baseURL,
      params: {
        page,
        limit,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      },
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Students retrieved:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to get students:', error.response?.data || error.message);
    throw error;
  }
}

// Environment-based configuration for College Student Directory
const ENV_CONFIG = {
  development: {
    baseURL: 'http://localhost:3000',
    apiPrefix: '/api/v1',
    frontendURL: 'http://localhost:3001'
  },
  production: {
    baseURL: 'https://your-college-api-domain.com',
    apiPrefix: '/api/v1',
    frontendURL: 'https://your-college-frontend-domain.com'
  }
};

function getApiConfig() {
  const env = process.env.NODE_ENV || 'development';
  return ENV_CONFIG[env] || ENV_CONFIG.development;
}

// Token management utilities
const TokenManager = {
  setToken(token) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('college_auth_token', token);
    }
  },

  getToken() {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('college_auth_token');
    }
    return null;
  },

  removeToken() {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('college_auth_token');
    }
  },

  isTokenValid(token) {
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CORRECT_CONFIG,
    ALTERNATIVE_CONFIG,
    buildApiUrl,
    buildDynamicUrl,
    getApiConfig,
    TokenManager,
    loginExample,
    createStudentExample,
    getStudentExample,
    axiosLoginExample,
    axiosUploadProfileExample,
    axiosGetStudentsExample
  };
}

/**
 * College Student Directory API - Summary & Best Practices:
 *
 * API Structure:
 * - Base URL: http://localhost:3000 (development)
 * - API Prefix: /api/v1
 * - Authentication: JWT Bearer tokens required for most endpoints
 * - Documentation: Available at http://localhost:3000/api/docs
 *
 * Key points to avoid the duplicate /api/v1 issue:
 *
 * 1. Either use full URLs including /api/v1 with a base URL that doesn't include /api/v1
 * 2. Or use a base URL + API prefix approach where you concatenate them
 * 3. Never include /api/v1 in both the base URL and the endpoint path
 *
 * Common mistakes:
 * - baseURL: 'http://localhost:3000/api/v1' + endpoint: '/api/v1/auth/login' = ❌ /api/v1/api/v1/auth/login
 *
 * Correct approaches:
 * - baseURL: 'http://localhost:3000' + endpoint: '/api/v1/auth/login' = ✅ /api/v1/auth/login
 * - baseURL: 'http://localhost:3000' + apiPrefix: '/api/v1' + endpoint: '/auth/login' = ✅ /api/v1/auth/login
 *
 * Available Endpoints:
 * - Authentication: /api/v1/auth/* (login, register, profile, change-password)
 * - Students: /api/v1/students/* (CRUD, search, statistics)
 * - Courses: /api/v1/courses/* (CRUD, statistics)
 * - Attendance: /api/v1/attendance/* (mark, bulk, statistics, reports)
 * - ID Cards: /api/v1/id-cards/* (generate, retrieve)
 * - Admin: /api/v1/admin/* (management, statistics)
 * - Upload: /api/v1/upload/* (profile, document, general)
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
 */
