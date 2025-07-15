/**
 * Example API Client Configuration
 * This file shows how to properly configure API calls to avoid the duplicate /api/v1 issue
 */

// ❌ INCORRECT - This will cause /api/v1/api/v1/auth/login
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
    login: '/api/v1/auth/login', // Full path including /api/v1
    register: '/api/v1/auth/register',
    profile: '/api/v1/auth/profile',
    students: '/api/v1/students',
    courses: '/api/v1/courses',
  }
};

// Alternative approach - separate base and API prefix
const ALTERNATIVE_CONFIG = {
  baseURL: 'http://localhost:3000',
  apiPrefix: '/api/v1',
  endpoints: {
    login: '/auth/login',
    register: '/auth/register',
    profile: '/auth/profile',
    students: '/students',
    courses: '/courses',
  }
};

// Helper function to build full URL
function buildApiUrl(endpoint) {
  return `${ALTERNATIVE_CONFIG.baseURL}${ALTERNATIVE_CONFIG.apiPrefix}${endpoint}`;
}

// Example usage with fetch
async function loginExample() {
  try {
    const response = await fetch(CORRECT_CONFIG.baseURL + CORRECT_CONFIG.endpoints.login, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@test.com',
        password: 'Admin@123'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Login successful:', data);
    return data;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}

// Example usage with alternative config
async function loginAlternativeExample() {
  try {
    const url = buildApiUrl(ALTERNATIVE_CONFIG.endpoints.login);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@test.com',
        password: 'Admin@123'
      })
    });

    const data = await response.json();
    console.log('Login successful:', data);
    return data;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}

// Example with Axios (if using axios library)
const axiosExample = {
  // ✅ CORRECT Axios configuration
  baseURL: 'http://localhost:3000', // No /api/v1 here
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
};

// Usage with axios
async function axiosLoginExample() {
  const axios = require('axios'); // You need to install axios: npm install axios
  
  try {
    const response = await axios.post('/api/v1/auth/login', {
      email: 'admin@test.com',
      password: 'Admin@123'
    }, {
      baseURL: axiosExample.baseURL,
      timeout: axiosExample.timeout,
      headers: axiosExample.headers
    });

    console.log('Login successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    throw error;
  }
}

// Environment-based configuration
const ENV_CONFIG = {
  development: {
    baseURL: 'http://localhost:3000',
    apiPrefix: '/api/v1'
  },
  production: {
    baseURL: 'https://your-production-domain.com',
    apiPrefix: '/api/v1'
  }
};

function getApiConfig() {
  const env = process.env.NODE_ENV || 'development';
  return ENV_CONFIG[env] || ENV_CONFIG.development;
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CORRECT_CONFIG,
    ALTERNATIVE_CONFIG,
    buildApiUrl,
    getApiConfig,
    loginExample,
    axiosLoginExample
  };
}

/**
 * Summary:
 * 
 * The key points to avoid the duplicate /api/v1 issue:
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
 */
