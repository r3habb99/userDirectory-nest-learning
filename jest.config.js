module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Module file extensions
  moduleFileExtensions: ['js', 'json', 'ts'],

  // Root directory
  rootDir: 'src',

  // Test regex patterns
  testRegex: '.*\\.spec\\.ts$',

  // Transform files
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },

  // Coverage collection
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.spec.ts',
    '!**/*.interface.ts',
    '!**/*.dto.ts',
    '!**/*.entity.ts',
    '!**/*.module.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/coverage/**',
    '!main.ts',
    '!**/*.d.ts',
  ],

  // Coverage directory
  coverageDirectory: '../coverage',

  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html', 'json'],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Test timeout
  testTimeout: 30000,

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],

  // Module name mapping
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@common/(.*)$': '<rootDir>/common/$1',
    '^@modules/(.*)$': '<rootDir>/modules/$1',
    '^@services/(.*)$': '<rootDir>/services/$1',
    '^@controllers/(.*)$': '<rootDir>/controllers/$1',
    '^@dto/(.*)$': '<rootDir>/dto/$1',
    '^@test/(.*)$': '<rootDir>/test/$1',
  },

  // Test projects for different types of tests
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/**/*.spec.ts'],
      testPathIgnorePatterns: [
        '<rootDir>/test/integration/',
        '<rootDir>/test/e2e/',
      ],
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/test/integration/**/*.spec.ts'],
      setupFilesAfterEnv: ['<rootDir>/test/integration-setup.ts'],
    },
    {
      displayName: 'e2e',
      testMatch: ['<rootDir>/test/e2e/**/*.spec.ts'],
      setupFilesAfterEnv: ['<rootDir>/test/e2e-setup.ts'],
    },
  ],

  // Global setup and teardown
  globalSetup: '<rootDir>/test/global-setup.ts',
  globalTeardown: '<rootDir>/test/global-teardown.ts',

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks after each test
  restoreMocks: true,

  // Reset modules between tests
  resetModules: true,

  // Error on deprecated features
  errorOnDeprecated: true,

  // Detect open handles
  detectOpenHandles: true,

  // Force exit after tests complete
  forceExit: true,

  // Max workers for parallel execution
  maxWorkers: '50%',

  // Cache directory
  cacheDirectory: '<rootDir>/../.jest-cache',

  // Preset
  preset: 'ts-jest',

  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))',
  ],

  // Module directories
  moduleDirectories: ['node_modules', '<rootDir>'],

  // Test result processor
  testResultsProcessor: 'jest-sonar-reporter',

  // Reporters
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: '../coverage',
        outputName: 'junit.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true,
      },
    ],
    [
      'jest-html-reporters',
      {
        publicPath: '../coverage/html-report',
        filename: 'report.html',
        expand: true,
      },
    ],
  ],

  // Watch plugins
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],

  // Notify mode
  notify: true,
  notifyMode: 'failure-change',

  // Bail on first test failure in CI
  bail: process.env.CI ? 1 : 0,

  // Silent mode in CI
  silent: process.env.CI === 'true',

  // Test name pattern
  testNamePattern: process.env.TEST_NAME_PATTERN,

  // Test path pattern
  testPathPattern: process.env.TEST_PATH_PATTERN,

  // Run tests in band in CI for better stability
  runInBand: process.env.CI === 'true',
};
