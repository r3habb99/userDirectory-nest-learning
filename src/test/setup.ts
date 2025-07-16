/**
 * Jest Test Setup
 * Global test configuration and utilities
 */

import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'mysql://test:test@localhost:3306/test_db';
process.env.JWT_SECRET = 'test-jwt-secret';

// Global test timeout
jest.setTimeout(30000);

// Mock console methods in test environment
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  // Suppress console.error and console.warn in tests unless explicitly needed
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  // Restore original console methods
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Global test utilities
global.testUtils = {
  // Helper to wait for async operations
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Helper to generate random test data
  randomString: (length: number = 10) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },
  
  // Helper to generate random email
  randomEmail: () => {
    const username = global.testUtils.randomString(8);
    const domain = global.testUtils.randomString(5);
    return `${username}@${domain}.com`;
  },
  
  // Helper to generate random phone
  randomPhone: () => {
    const areaCode = Math.floor(Math.random() * 900) + 100;
    const exchange = Math.floor(Math.random() * 900) + 100;
    const number = Math.floor(Math.random() * 9000) + 1000;
    return `+1${areaCode}${exchange}${number}`;
  },
};

// Custom matchers
expect.extend({
  toBeValidApiResponse(received) {
    const pass = (
      typeof received === 'object' &&
      received !== null &&
      typeof received.success === 'boolean' &&
      typeof received.message === 'string' &&
      typeof received.statusCode === 'number'
    );

    if (pass) {
      return {
        message: () => `expected ${JSON.stringify(received)} not to be a valid API response`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${JSON.stringify(received)} to be a valid API response with success, message, and statusCode properties`,
        pass: false,
      };
    }
  },

  toBeValidPaginatedResponse(received) {
    const pass = (
      typeof received === 'object' &&
      received !== null &&
      typeof received.success === 'boolean' &&
      typeof received.message === 'string' &&
      typeof received.statusCode === 'number' &&
      Array.isArray(received.data) &&
      typeof received.pagination === 'object' &&
      received.pagination !== null &&
      typeof received.pagination.page === 'number' &&
      typeof received.pagination.limit === 'number' &&
      typeof received.pagination.total === 'number' &&
      typeof received.pagination.totalPages === 'number' &&
      typeof received.pagination.hasNext === 'boolean' &&
      typeof received.pagination.hasPrev === 'boolean'
    );

    if (pass) {
      return {
        message: () => `expected ${JSON.stringify(received)} not to be a valid paginated response`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${JSON.stringify(received)} to be a valid paginated response`,
        pass: false,
      };
    }
  },

  toBeValidErrorResponse(received) {
    const pass = (
      typeof received === 'object' &&
      received !== null &&
      received.success === false &&
      typeof received.message === 'string' &&
      typeof received.error === 'string' &&
      typeof received.statusCode === 'number'
    );

    if (pass) {
      return {
        message: () => `expected ${JSON.stringify(received)} not to be a valid error response`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${JSON.stringify(received)} to be a valid error response`,
        pass: false,
      };
    }
  },

  toBeValidStudent(received) {
    const requiredFields = [
      'id', 'enrollmentNumber', 'name', 'email', 'phone', 'age',
      'gender', 'address', 'admissionYear', 'passoutYear', 'isActive',
      'createdAt', 'updatedAt'
    ];

    const pass = (
      typeof received === 'object' &&
      received !== null &&
      requiredFields.every(field => received.hasOwnProperty(field))
    );

    if (pass) {
      return {
        message: () => `expected ${JSON.stringify(received)} not to be a valid student object`,
        pass: true,
      };
    } else {
      const missingFields = requiredFields.filter(field => !received?.hasOwnProperty(field));
      return {
        message: () => `expected student object to have all required fields. Missing: ${missingFields.join(', ')}`,
        pass: false,
      };
    }
  },
});

// Declare global types for TypeScript
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidApiResponse(): R;
      toBeValidPaginatedResponse(): R;
      toBeValidErrorResponse(): R;
      toBeValidStudent(): R;
    }
  }

  var testUtils: {
    wait: (ms: number) => Promise<void>;
    randomString: (length?: number) => string;
    randomEmail: () => string;
    randomPhone: () => string;
  };
}

// Mock external dependencies that are not needed in tests
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  })),
}));

jest.mock('multer', () => ({
  diskStorage: jest.fn(),
  memoryStorage: jest.fn(),
}));

// Increase Node.js memory limit for tests
if (process.env.NODE_OPTIONS?.includes('--max-old-space-size') === false) {
  process.env.NODE_OPTIONS = (process.env.NODE_OPTIONS || '') + ' --max-old-space-size=4096';
}

// Handle unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process in tests, just log the error
});

// Handle uncaught exceptions in tests
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit the process in tests, just log the error
});

export {};
