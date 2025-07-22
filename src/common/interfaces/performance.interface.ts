/**
 * Performance and Health Monitoring Interfaces
 * Defines types for performance metrics, health checks, and system monitoring
 */

/**
 * Health status interface for system health checks
 */
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  responseTime: number;
  checks: {
    database: HealthCheck;
    disk: HealthCheck;
    memory: HealthCheck;
    uploads: HealthCheck;
  };
  version: string;
  environment: string;
}

/**
 * Individual health check result interface
 */
export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  responseTime?: number;
  details?: any;
}

/**
 * System metrics interface for monitoring system resources
 */
export interface SystemMetrics {
  timestamp: string;
  uptime: {
    seconds: number;
    human: string;
  };
  memory: {
    heapUsedMB: string;
    heapTotalMB: string;
    rssMB: string;
    externalMB: string;
  };
  process: {
    pid: number;
    version: string;
    platform: string;
    arch: string;
  };
}

/**
 * Cache statistics interface for monitoring cache performance
 */
export interface CacheStats {
  totalKeys: number;
  totalSize: number;
  expiredCount: number;
  hitRate: number;
}
