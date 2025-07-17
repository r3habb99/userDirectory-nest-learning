import { registerAs } from '@nestjs/config';
import { IsNumber, IsBoolean, IsOptional, validateSync } from 'class-validator';
import { plainToClass, Transform } from 'class-transformer';

/**
 * Performance Configuration
 * Centralized performance settings for the application
 */

class PerformanceConfig {
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value === 'true' : Boolean(value),
  )
  enableMetrics?: boolean = false;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value === 'true' : Boolean(value),
  )
  enableQueryOptimization?: boolean = true;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value === 'true' : Boolean(value),
  )
  enableCaching?: boolean = true;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? parseInt(value, 10) : Number(value),
  )
  metricsInterval?: number = 60000; // 1 minute

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? parseInt(value, 10) : Number(value),
  )
  slowRequestThreshold?: number = 1000; // 1 second

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? parseInt(value, 10) : Number(value),
  )
  slowQueryThreshold?: number = 1000; // 1 second

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? parseInt(value, 10) : Number(value),
  )
  cacheDefaultTTL?: number = 300000; // 5 minutes

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? parseInt(value, 10) : Number(value),
  )
  cacheMaxSize?: number = 1000;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? parseInt(value, 10) : Number(value),
  )
  maxRequestSize?: number = 10 * 1024 * 1024; // 10MB

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? parseInt(value, 10) : Number(value),
  )
  memoryThreshold?: number = 500 * 1024 * 1024; // 500MB

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? parseInt(value, 10) : Number(value),
  )
  gcCooldownPeriod?: number = 60000; // 1 minute

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? parseInt(value, 10) : Number(value),
  )
  connectionPoolSize?: number = 10;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? parseInt(value, 10) : Number(value),
  )
  queryTimeout?: number = 30000; // 30 seconds

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? parseInt(value, 10) : Number(value),
  )
  maxConcurrentQueries?: number = 50;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value === 'true' : Boolean(value),
  )
  enableQueryLogging?: boolean = false;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value === 'true' : Boolean(value),
  )
  enableRequestLogging?: boolean = true;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? parseInt(value, 10) : Number(value),
  )
  rateLimitWindow?: number = 60000; // 1 minute

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? parseInt(value, 10) : Number(value),
  )
  rateLimitMax?: number = 100;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value === 'true' : Boolean(value),
  )
  enableCompression?: boolean = true;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? parseInt(value, 10) : Number(value),
  )
  compressionThreshold?: number = 1024; // 1KB

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value === 'true' : Boolean(value),
  )
  enableEtag?: boolean = true;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? parseInt(value, 10) : Number(value),
  )
  staticFileMaxAge?: number = 86400000; // 1 day

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value === 'true' : Boolean(value),
  )
  enablePrefetch?: boolean = false;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? parseInt(value, 10) : Number(value),
  )
  prefetchBatchSize?: number = 10;
}

export const performanceConfig = registerAs('performance', () => {
  const config = plainToClass(PerformanceConfig, {
    enableMetrics: process.env.ENABLE_METRICS,
    enableQueryOptimization: process.env.ENABLE_QUERY_OPTIMIZATION,
    enableCaching: process.env.ENABLE_CACHING,
    metricsInterval: process.env.METRICS_INTERVAL,
    slowRequestThreshold: process.env.SLOW_REQUEST_THRESHOLD,
    slowQueryThreshold: process.env.SLOW_QUERY_THRESHOLD,
    cacheDefaultTTL: process.env.CACHE_DEFAULT_TTL,
    cacheMaxSize: process.env.CACHE_MAX_SIZE,
    maxRequestSize: process.env.MAX_REQUEST_SIZE,
    memoryThreshold: process.env.MEMORY_THRESHOLD,
    gcCooldownPeriod: process.env.GC_COOLDOWN_PERIOD,
    connectionPoolSize: process.env.CONNECTION_POOL_SIZE,
    queryTimeout: process.env.QUERY_TIMEOUT,
    maxConcurrentQueries: process.env.MAX_CONCURRENT_QUERIES,
    enableQueryLogging: process.env.ENABLE_QUERY_LOGGING,
    enableRequestLogging: process.env.ENABLE_REQUEST_LOGGING,
    rateLimitWindow: process.env.RATE_LIMIT_WINDOW,
    rateLimitMax: process.env.RATE_LIMIT_MAX,
    enableCompression: process.env.ENABLE_COMPRESSION,
    compressionThreshold: process.env.COMPRESSION_THRESHOLD,
    enableEtag: process.env.ENABLE_ETAG,
    staticFileMaxAge: process.env.STATIC_FILE_MAX_AGE,
    enablePrefetch: process.env.ENABLE_PREFETCH,
    prefetchBatchSize: process.env.PREFETCH_BATCH_SIZE,
  });

  const errors = validateSync(config);
  if (errors.length > 0) {
    const errorMessages = errors
      .map((error) => Object.values(error.constraints || {}).join(', '))
      .join('; ');
    throw new Error(
      `Performance configuration validation failed: ${errorMessages}`,
    );
  }

  return config;
});

/**
 * Database Performance Configuration
 */
export const DATABASE_PERFORMANCE = {
  // Connection pool settings
  POOL: {
    MIN: 2,
    MAX: 10,
    ACQUIRE_TIMEOUT: 60000,
    IDLE_TIMEOUT: 10000,
    EVICT_INTERVAL: 5000,
  },

  // Query optimization settings
  QUERY: {
    TIMEOUT: 30000,
    SLOW_THRESHOLD: 1000,
    BATCH_SIZE: 100,
    MAX_CONCURRENT: 50,
  },

  // Index hints for common queries
  INDEXES: {
    STUDENTS: {
      SEARCH: ['name', 'enrollmentNumber', 'email'],
      FILTER: ['isActive', 'courseId', 'admissionYear'],
      SORT: ['createdAt', 'name', 'enrollmentNumber'],
    },
    ATTENDANCE: {
      SEARCH: ['studentId', 'date'],
      FILTER: ['status', 'date'],
      SORT: ['date', 'createdAt'],
    },
    COURSES: {
      SEARCH: ['name', 'type'],
      FILTER: ['type', 'isActive'],
      SORT: ['name', 'createdAt'],
    },
  },
} as const;

/**
 * Cache Performance Configuration
 */
export const CACHE_PERFORMANCE = {
  // TTL settings for different data types
  TTL: {
    STATIC_DATA: 24 * 60 * 60 * 1000, // 24 hours
    STATISTICS: 10 * 60 * 1000, // 10 minutes
    USER_DATA: 5 * 60 * 1000, // 5 minutes
    SEARCH_RESULTS: 2 * 60 * 1000, // 2 minutes
    SESSION_DATA: 30 * 60 * 1000, // 30 minutes
  },

  // Cache strategies
  STRATEGIES: {
    WRITE_THROUGH: ['user_profiles', 'course_data'],
    WRITE_BEHIND: ['statistics', 'analytics'],
    CACHE_ASIDE: ['search_results', 'filtered_data'],
  },

  // Invalidation patterns
  INVALIDATION: {
    STUDENT_UPDATED: ['students:*', 'stats:students*'],
    COURSE_UPDATED: ['courses:*', 'stats:courses*', 'students:*'],
    ATTENDANCE_UPDATED: ['attendance:*', 'stats:attendance*'],
  },
} as const;

/**
 * File Upload Performance Configuration
 */
export const UPLOAD_PERFORMANCE = {
  // Image optimization settings
  IMAGE: {
    MAX_WIDTH: 1920,
    MAX_HEIGHT: 1080,
    QUALITY: 85,
    PROGRESSIVE: true,
    STRIP_METADATA: true,
  },

  // File size limits
  SIZE_LIMITS: {
    PROFILE_IMAGE: 5 * 1024 * 1024, // 5MB
    DOCUMENT: 10 * 1024 * 1024, // 10MB
    GENERAL: 2 * 1024 * 1024, // 2MB
  },

  // Processing options
  PROCESSING: {
    ENABLE_WEBP: true,
    ENABLE_THUMBNAILS: true,
    THUMBNAIL_SIZES: [150, 300, 600],
    CONCURRENT_UPLOADS: 3,
  },
} as const;

/**
 * API Performance Configuration
 */
export const API_PERFORMANCE = {
  // Response optimization
  RESPONSE: {
    ENABLE_COMPRESSION: true,
    COMPRESSION_THRESHOLD: 1024,
    ENABLE_ETAG: true,
    CACHE_CONTROL_MAX_AGE: 300, // 5 minutes
  },

  // Request optimization
  REQUEST: {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    TIMEOUT: 30000, // 30 seconds
    KEEP_ALIVE_TIMEOUT: 5000,
    HEADERS_TIMEOUT: 60000,
  },

  // Pagination defaults
  PAGINATION: {
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
    DEFAULT_PAGE: 1,
  },
} as const;

/**
 * Monitoring and Alerting Configuration
 */
export const MONITORING_CONFIG = {
  // Performance thresholds
  THRESHOLDS: {
    RESPONSE_TIME_WARNING: 1000, // 1 second
    RESPONSE_TIME_CRITICAL: 5000, // 5 seconds
    ERROR_RATE_WARNING: 5, // 5%
    ERROR_RATE_CRITICAL: 10, // 10%
    MEMORY_WARNING: 80, // 80% of available
    MEMORY_CRITICAL: 90, // 90% of available
    CPU_WARNING: 70, // 70%
    CPU_CRITICAL: 85, // 85%
  },

  // Metrics collection
  METRICS: {
    COLLECTION_INTERVAL: 60000, // 1 minute
    RETENTION_PERIOD: 7 * 24 * 60 * 60 * 1000, // 7 days
    AGGREGATION_WINDOW: 5 * 60 * 1000, // 5 minutes
  },

  // Health check settings
  HEALTH_CHECK: {
    INTERVAL: 30000, // 30 seconds
    TIMEOUT: 5000, // 5 seconds
    RETRIES: 3,
  },
} as const;
