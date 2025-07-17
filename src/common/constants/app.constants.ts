/**
 * Application Constants
 * Centralized location for all application constants
 */

// API Configuration
export const API_CONFIG = {
  VERSION: 'v1',
  PREFIX: '/api/v1',
  GLOBAL_PREFIX: 'api',
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  DEFAULT_SORT_ORDER: 'desc' as const,
  DEFAULT_SORT_FIELD: 'createdAt',
} as const;

// Authentication & Authorization
export const AUTH_CONFIG = {
  JWT_EXPIRES_IN: '24h',
  JWT_REFRESH_EXPIRES_IN: '7d',
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
} as const;

// User Roles
export const USER_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  STAFF: 'STAFF',
  STUDENT: 'STUDENT',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

// Course Types
export const COURSE_TYPES = {
  BCA: 'BCA',
  MCA: 'MCA',
  BBA: 'BBA',
  MBA: 'MBA',
  BCOM: 'BCOM',
  MCOM: 'MCOM',
} as const;

export type CourseType = (typeof COURSE_TYPES)[keyof typeof COURSE_TYPES];

// Course Durations (in years)
export const COURSE_DURATIONS: Record<CourseType, number> = {
  [COURSE_TYPES.BCA]: 3,
  [COURSE_TYPES.MCA]: 2,
  [COURSE_TYPES.BBA]: 3,
  [COURSE_TYPES.MBA]: 2,
  [COURSE_TYPES.BCOM]: 3,
  [COURSE_TYPES.MCOM]: 2,
} as const;

// Gender Options
export const GENDER_OPTIONS = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  OTHER: 'OTHER',
} as const;

export type Gender = (typeof GENDER_OPTIONS)[keyof typeof GENDER_OPTIONS];

// Attendance Status
export const ATTENDANCE_STATUS = {
  PRESENT: 'PRESENT',
  ABSENT: 'ABSENT',
  LATE: 'LATE',
  EXCUSED: 'EXCUSED',
} as const;

export type AttendanceStatus =
  (typeof ATTENDANCE_STATUS)[keyof typeof ATTENDANCE_STATUS];

// File Upload Configuration
export const FILE_UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  ALLOWED_DOCUMENT_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  UPLOAD_PATHS: {
    PROFILE_PHOTOS: 'uploads/profiles',
    ID_CARDS: 'uploads/id-cards',
    DOCUMENTS: 'uploads/documents',
    TEMP: 'uploads/temp',
  },
} as const;

// Validation Rules
export const VALIDATION_RULES = {
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
    PATTERN: /^[a-zA-Z\s.'-]+$/,
  },
  EMAIL: {
    MAX_LENGTH: 255,
    PATTERN: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  },
  PHONE: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 15,
    PATTERN: /^[+]?[\d\s\-()]{10,15}$/,
  },
  ENROLLMENT_NUMBER: {
    PATTERN: /^\d{4}(BCA|MCA|BBA|MBA|BCOM|MCOM)\d{3}$/,
    LENGTH: 10,
  },
  ADDRESS: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 500,
  },
  AGE: {
    MIN: 16,
    MAX: 60,
  },
  ACADEMIC_YEAR: {
    MIN: 2020,
    MAX: new Date().getFullYear() + 10,
  },
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  // Authentication
  INVALID_CREDENTIALS: 'Invalid email or password',
  ACCOUNT_LOCKED:
    'Account is temporarily locked due to too many failed login attempts',
  TOKEN_EXPIRED: 'Authentication token has expired',
  INVALID_TOKEN: 'Invalid authentication token',
  UNAUTHORIZED: 'You are not authorized to perform this action',
  FORBIDDEN: 'Access to this resource is forbidden',

  // Validation
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Please provide a valid email address',
  INVALID_PHONE: 'Please provide a valid phone number',
  INVALID_PASSWORD:
    'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character',
  INVALID_AGE: 'Age must be between 16 and 60 years',
  INVALID_ENROLLMENT_NUMBER:
    'Enrollment number must follow the format YYYYCCC### (e.g., 2024BCA001)',

  // Resource Not Found
  STUDENT_NOT_FOUND: 'Student not found',
  ADMIN_NOT_FOUND: 'Admin not found',
  COURSE_NOT_FOUND: 'Course not found',
  ATTENDANCE_NOT_FOUND: 'Attendance record not found',
  ID_CARD_NOT_FOUND: 'ID card not found',

  // Duplicate Resources
  EMAIL_ALREADY_EXISTS: 'Email address is already registered',
  PHONE_ALREADY_EXISTS: 'Phone number is already registered',
  ENROLLMENT_NUMBER_EXISTS: 'Enrollment number already exists',

  // File Upload
  FILE_TOO_LARGE: 'File size exceeds the maximum allowed limit',
  INVALID_FILE_TYPE: 'File type is not supported',
  FILE_UPLOAD_FAILED: 'Failed to upload file',

  // Business Logic
  COURSE_CAPACITY_EXCEEDED: 'Course has reached maximum capacity',
  INVALID_ADMISSION_YEAR: 'Admission year cannot be in the future',
  INVALID_PASSOUT_YEAR: 'Passout year must be after admission year',
  ATTENDANCE_ALREADY_MARKED: 'Attendance has already been marked for this date',

  // System Errors
  INTERNAL_SERVER_ERROR: 'An internal server error occurred',
  DATABASE_ERROR: 'Database operation failed',
  EXTERNAL_SERVICE_ERROR: 'External service is currently unavailable',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  // Authentication
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  PASSWORD_CHANGED: 'Password changed successfully',

  // CRUD Operations
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
  RETRIEVED: 'Data retrieved successfully',

  // Specific Operations
  STUDENT_CREATED: 'Student registered successfully',
  STUDENT_UPDATED: 'Student information updated successfully',
  ATTENDANCE_MARKED: 'Attendance marked successfully',
  ID_CARD_GENERATED: 'ID card generated successfully',
  FILE_UPLOADED: 'File uploaded successfully',
} as const;

// Cache Keys
export const CACHE_KEYS = {
  STUDENT_BY_ID: (id: string) => `student:${id}`,
  STUDENT_BY_ENROLLMENT: (enrollmentNumber: string) =>
    `student:enrollment:${enrollmentNumber}`,
  COURSE_BY_ID: (id: string) => `course:${id}`,
  ADMIN_BY_ID: (id: string) => `admin:${id}`,
  ATTENDANCE_BY_DATE: (studentId: string, date: string) =>
    `attendance:${studentId}:${date}`,
  STUDENTS_BY_COURSE: (courseId: string, page: number) =>
    `students:course:${courseId}:page:${page}`,
} as const;

// Rate Limiting
export const RATE_LIMITS = {
  AUTH: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 5,
  },
  API: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
  },
  UPLOAD: {
    WINDOW_MS: 60 * 60 * 1000, // 1 hour
    MAX_REQUESTS: 50,
  },
  PASSWORD_RESET: {
    WINDOW_MS: 60 * 60 * 1000, // 1 hour
    MAX_REQUESTS: 3,
  },
} as const;

// Database Configuration
export const DATABASE_CONFIG = {
  CONNECTION_POOL_SIZE: 10,
  QUERY_TIMEOUT: 30000, // 30 seconds
  CONNECTION_TIMEOUT: 60000, // 60 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

// Logging Configuration
export const LOGGING_CONFIG = {
  LEVELS: {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug',
    VERBOSE: 'verbose',
  },
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES: 5,
  DATE_PATTERN: 'YYYY-MM-DD',
} as const;

// Security Configuration
export const SECURITY_CONFIG = {
  BCRYPT_ROUNDS: 12,
  CORS_MAX_AGE: 86400, // 24 hours
  HELMET_CONFIG: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  },
} as const;

// Enrollment Number Generation
export const ENROLLMENT_CONFIG = {
  STARTING_NUMBER: 1,
  MAX_STUDENTS_PER_COURSE_PER_YEAR: 300,
  NUMBER_PADDING: 3, // e.g., 001, 002, etc.
} as const;

// ID Card Configuration
export const ID_CARD_CONFIG = {
  VALIDITY_YEARS: 4,
  QR_CODE_SIZE: 200,
  IMAGE_WIDTH: 400,
  IMAGE_HEIGHT: 600,
  TEMPLATE_PATH: 'assets/id-card-template.png',
} as const;

// Pagination Defaults
export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 10,
  MAX_LIMIT: 100,
  SORT_BY: 'createdAt',
  SORT_ORDER: 'desc' as const,
} as const;

// Date Formats
export const DATE_FORMATS = {
  ISO: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
  DATE_ONLY: 'YYYY-MM-DD',
  DISPLAY: 'DD/MM/YYYY',
  DISPLAY_WITH_TIME: 'DD/MM/YYYY HH:mm:ss',
  FILE_TIMESTAMP: 'YYYYMMDD_HHmmss',
} as const;

// Regular Expressions
export const REGEX_PATTERNS = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  PHONE: /^[+]?[\d\s\-()]{10,15}$/,
  NAME: /^[a-zA-Z\s.'-]+$/,
  ENROLLMENT_NUMBER: /^\d{4}(BCA|MCA|BBA|MBA|BCOM|MCOM)\d{3}$/,
  CUID: /^c[a-z0-9]{24}$/,
  STRONG_PASSWORD:
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
} as const;
