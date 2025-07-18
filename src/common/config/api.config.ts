/**
 * API Configuration Constants
 * Centralized configuration for API routes, prefixes, and URLs
 */

/**
 * API version and prefix configuration
 */
export const API_CONFIG = {
  /** API version prefix */
  PREFIX: 'api/v1',

  /** API version */
  VERSION: '1.0',

  /** API version number for headers */
  VERSION_HEADER: 'X-API-Version',

  /** Default port */
  DEFAULT_PORT: 3000,

  /** Default frontend URL */
  DEFAULT_FRONTEND_URL: 'http://localhost:3001',

  /** API rate limiting */
  RATE_LIMIT: {
    TTL: 60, // Time window in seconds
    LIMIT: 100, // Max requests per window
  },

  /** API pagination defaults */
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
  },

  /** API response formats */
  RESPONSE_FORMATS: {
    JSON: 'application/json',
    XML: 'application/xml',
    CSV: 'text/csv',
  },
} as const;

/**
 * API route paths (without prefix)
 */
export const API_ROUTES = {
  AUTH: {
    BASE: 'auth',
    LOGIN: 'auth/login',
    REGISTER: 'auth/register',
    CHANGE_PASSWORD: 'auth/change-password',
    PROFILE: 'auth/profile',
  },
  STUDENTS: {
    BASE: 'students',
  },
  COURSES: {
    BASE: 'courses',
  },
  ATTENDANCE: {
    BASE: 'attendance',
  },
  ID_CARDS: {
    BASE: 'id-cards',
  },
  ADMIN: {
    BASE: 'admin',
  },
  UPLOAD: {
    BASE: 'upload',
  },
  USERS: {
    BASE: 'users',
  },
} as const;

/**
 * Full API URLs (with prefix)
 */
export const API_URLS = {
  AUTH: {
    LOGIN: `/${API_CONFIG.PREFIX}/${API_ROUTES.AUTH.LOGIN}`,
    REGISTER: `/${API_CONFIG.PREFIX}/${API_ROUTES.AUTH.REGISTER}`,
    CHANGE_PASSWORD: `/${API_CONFIG.PREFIX}/${API_ROUTES.AUTH.CHANGE_PASSWORD}`,
    PROFILE: `/${API_CONFIG.PREFIX}/${API_ROUTES.AUTH.PROFILE}`,
  },
  STUDENTS: `/${API_CONFIG.PREFIX}/${API_ROUTES.STUDENTS.BASE}`,
  COURSES: `/${API_CONFIG.PREFIX}/${API_ROUTES.COURSES.BASE}`,
  ATTENDANCE: `/${API_CONFIG.PREFIX}/${API_ROUTES.ATTENDANCE.BASE}`,
  ID_CARDS: `/${API_CONFIG.PREFIX}/${API_ROUTES.ID_CARDS.BASE}`,
  ADMIN: `/${API_CONFIG.PREFIX}/${API_ROUTES.ADMIN.BASE}`,
  UPLOAD: `/${API_CONFIG.PREFIX}/${API_ROUTES.UPLOAD.BASE}`,
  USERS: `/${API_CONFIG.PREFIX}/${API_ROUTES.USERS.BASE}`,
} as const;

/**
 * Helper function to build API URL
 */
export function buildApiUrl(path: string): string {
  return `/${API_CONFIG.PREFIX}/${path}`;
}

/**
 * Helper function to get base URL for environment
 */
export function getBaseUrl(port?: number): string {
  const apiPort = port || API_CONFIG.DEFAULT_PORT;
  return `http://localhost:${apiPort}`;
}

/**
 * Helper function to get full API base URL
 */
export function getApiBaseUrl(port?: number): string {
  return `${getBaseUrl(port)}/${API_CONFIG.PREFIX}`;
}

/**
 * Documentation configuration
 */
export const DOCS_CONFIG = {
  PATH: 'api/docs',
  TITLE: 'College Student Directory API',
  DESCRIPTION:
    'A comprehensive API for managing college students, courses, attendance, and ID cards. ' +
    'This API allows administrators to manage student records, track attendance, generate ID cards, ' +
    'and manage course information. All endpoints except login and register require JWT authentication.',
  CONTACT: {
    name: 'College Admin',
    url: 'https://college-directory.example.com',
    email: 'admin@college.edu',
  },
  LICENSE: {
    name: 'MIT',
    url: 'https://opensource.org/licenses/MIT',
  },
  SERVERS: [
    {
      url: 'http://localhost:3000/api/v1',
      description: 'Development server',
    },
    {
      url: 'https://api.college-directory.example.com/api/v1',
      description: 'Production server',
    },
  ],
  TAGS: [
    {
      name: 'System',
      description: 'System health and information endpoints',
    },
    {
      name: 'Authentication',
      description: 'Admin authentication and authorization endpoints',
    },
    {
      name: 'Students',
      description: 'Student management and information endpoints',
    },
    {
      name: 'Courses',
      description: 'Course management and information endpoints',
    },
    {
      name: 'Attendance',
      description: 'Attendance tracking and reporting endpoints',
    },
    {
      name: 'ID Cards',
      description: 'ID card generation and management endpoints',
    },
    {
      name: 'Admin Management',
      description: 'Admin user management endpoints',
    },
    {
      name: 'File Upload',
      description: 'File upload and management endpoints',
    },
  ],
} as const;
