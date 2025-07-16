import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Performance Monitoring Service
 * Tracks application performance metrics and provides insights
 */
@Injectable()
export class PerformanceMonitorService implements OnModuleInit {
  private readonly logger = new Logger(PerformanceMonitorService.name);
  private readonly enableMetrics: boolean;
  private readonly metricsInterval: number;
  
  // Performance metrics storage
  private metrics = {
    requests: {
      total: 0,
      successful: 0,
      failed: 0,
      averageResponseTime: 0,
      slowRequests: 0, // > 1000ms
    },
    database: {
      queries: 0,
      slowQueries: 0, // > 1000ms
      averageQueryTime: 0,
      connectionPoolUsage: 0,
    },
    cache: {
      hits: 0,
      misses: 0,
      hitRate: 0,
      evictions: 0,
    },
    memory: {
      heapUsed: 0,
      heapTotal: 0,
      rss: 0,
      external: 0,
    },
    system: {
      uptime: 0,
      cpuUsage: 0,
      loadAverage: [] as number[],
    },
  };

  // Request timing storage
  private requestTimings: number[] = [];
  private queryTimings: number[] = [];
  private readonly maxTimingsSamples = 1000;

  constructor(private readonly configService: ConfigService) {
    this.enableMetrics = this.configService.get<boolean>('ENABLE_METRICS', false);
    this.metricsInterval = this.configService.get<number>('METRICS_INTERVAL', 60000); // 1 minute
  }

  async onModuleInit() {
    if (this.enableMetrics) {
      this.startMetricsCollection();
      this.logger.log('Performance monitoring started');
    }
  }

  /**
   * Record request performance
   */
  recordRequest(responseTime: number, success: boolean): void {
    if (!this.enableMetrics) return;

    this.metrics.requests.total++;
    
    if (success) {
      this.metrics.requests.successful++;
    } else {
      this.metrics.requests.failed++;
    }

    if (responseTime > 1000) {
      this.metrics.requests.slowRequests++;
    }

    // Store timing for average calculation
    this.requestTimings.push(responseTime);
    if (this.requestTimings.length > this.maxTimingsSamples) {
      this.requestTimings.shift();
    }

    // Update average
    this.metrics.requests.averageResponseTime = 
      this.requestTimings.reduce((sum, time) => sum + time, 0) / this.requestTimings.length;
  }

  /**
   * Record database query performance
   */
  recordQuery(queryTime: number): void {
    if (!this.enableMetrics) return;

    this.metrics.database.queries++;
    
    if (queryTime > 1000) {
      this.metrics.database.slowQueries++;
    }

    // Store timing for average calculation
    this.queryTimings.push(queryTime);
    if (this.queryTimings.length > this.maxTimingsSamples) {
      this.queryTimings.shift();
    }

    // Update average
    this.metrics.database.averageQueryTime = 
      this.queryTimings.reduce((sum, time) => sum + time, 0) / this.queryTimings.length;
  }

  /**
   * Record cache performance
   */
  recordCacheHit(): void {
    if (!this.enableMetrics) return;
    this.metrics.cache.hits++;
    this.updateCacheHitRate();
  }

  recordCacheMiss(): void {
    if (!this.enableMetrics) return;
    this.metrics.cache.misses++;
    this.updateCacheHitRate();
  }

  recordCacheEviction(): void {
    if (!this.enableMetrics) return;
    this.metrics.cache.evictions++;
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    this.updateSystemMetrics();
    return { ...this.metrics };
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): PerformanceSummary {
    const metrics = this.getMetrics();
    
    return {
      timestamp: new Date().toISOString(),
      health: this.calculateHealthScore(metrics),
      alerts: this.generateAlerts(metrics),
      recommendations: this.generateRecommendations(metrics),
      summary: {
        totalRequests: metrics.requests.total,
        averageResponseTime: Math.round(metrics.requests.averageResponseTime),
        errorRate: metrics.requests.total > 0 
          ? (metrics.requests.failed / metrics.requests.total) * 100 
          : 0,
        cacheHitRate: metrics.cache.hitRate,
        slowQueriesCount: metrics.database.slowQueries,
        memoryUsageMB: Math.round(metrics.memory.heapUsed / (1024 * 1024)),
      },
    };
  }

  /**
   * Reset metrics (useful for testing or periodic resets)
   */
  resetMetrics(): void {
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        averageResponseTime: 0,
        slowRequests: 0,
      },
      database: {
        queries: 0,
        slowQueries: 0,
        averageQueryTime: 0,
        connectionPoolUsage: 0,
      },
      cache: {
        hits: 0,
        misses: 0,
        hitRate: 0,
        evictions: 0,
      },
      memory: {
        heapUsed: 0,
        heapTotal: 0,
        rss: 0,
        external: 0,
      },
      system: {
        uptime: 0,
        cpuUsage: 0,
        loadAverage: [],
      },
    };
    
    this.requestTimings = [];
    this.queryTimings = [];
    
    this.logger.log('Performance metrics reset');
  }

  /**
   * Start periodic metrics collection
   */
  private startMetricsCollection(): void {
    setInterval(() => {
      this.updateSystemMetrics();
      this.logPerformanceMetrics();
    }, this.metricsInterval);
  }

  /**
   * Update cache hit rate
   */
  private updateCacheHitRate(): void {
    const total = this.metrics.cache.hits + this.metrics.cache.misses;
    this.metrics.cache.hitRate = total > 0 
      ? (this.metrics.cache.hits / total) * 100 
      : 0;
  }

  /**
   * Update system metrics
   */
  private updateSystemMetrics(): void {
    const memUsage = process.memoryUsage();
    
    this.metrics.memory = {
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      rss: memUsage.rss,
      external: memUsage.external,
    };

    this.metrics.system.uptime = process.uptime();
    
    // CPU usage would require additional libraries in production
    // For now, we'll use a placeholder
    this.metrics.system.cpuUsage = 0;
    this.metrics.system.loadAverage = [];
  }

  /**
   * Calculate overall health score (0-100)
   */
  private calculateHealthScore(metrics: PerformanceMetrics): number {
    let score = 100;
    
    // Deduct points for high error rate
    const errorRate = metrics.requests.total > 0 
      ? (metrics.requests.failed / metrics.requests.total) * 100 
      : 0;
    score -= errorRate * 2; // 2 points per 1% error rate
    
    // Deduct points for slow response times
    if (metrics.requests.averageResponseTime > 1000) {
      score -= 20;
    } else if (metrics.requests.averageResponseTime > 500) {
      score -= 10;
    }
    
    // Deduct points for low cache hit rate
    if (metrics.cache.hitRate < 50) {
      score -= 15;
    } else if (metrics.cache.hitRate < 80) {
      score -= 5;
    }
    
    // Deduct points for slow queries
    const slowQueryRate = metrics.database.queries > 0 
      ? (metrics.database.slowQueries / metrics.database.queries) * 100 
      : 0;
    score -= slowQueryRate;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate performance alerts
   */
  private generateAlerts(metrics: PerformanceMetrics): string[] {
    const alerts: string[] = [];
    
    if (metrics.requests.averageResponseTime > 2000) {
      alerts.push('High average response time detected');
    }
    
    if (metrics.cache.hitRate < 50) {
      alerts.push('Low cache hit rate detected');
    }
    
    if (metrics.database.slowQueries > 10) {
      alerts.push('Multiple slow database queries detected');
    }
    
    const memoryUsageMB = metrics.memory.heapUsed / (1024 * 1024);
    if (memoryUsageMB > 500) {
      alerts.push('High memory usage detected');
    }
    
    return alerts;
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(metrics: PerformanceMetrics): string[] {
    const recommendations: string[] = [];
    
    if (metrics.cache.hitRate < 80) {
      recommendations.push('Consider increasing cache TTL or improving cache strategy');
    }
    
    if (metrics.database.slowQueries > 5) {
      recommendations.push('Review and optimize slow database queries');
    }
    
    if (metrics.requests.averageResponseTime > 1000) {
      recommendations.push('Consider implementing response caching or optimizing business logic');
    }
    
    return recommendations;
  }

  /**
   * Log performance metrics periodically
   */
  private logPerformanceMetrics(): void {
    const summary = this.getPerformanceSummary();
    
    this.logger.log(`Performance Summary - Health: ${summary.health}%, ` +
      `Avg Response: ${summary.summary.averageResponseTime}ms, ` +
      `Cache Hit Rate: ${summary.summary.cacheHitRate.toFixed(1)}%, ` +
      `Memory: ${summary.summary.memoryUsageMB}MB`);
    
    if (summary.alerts.length > 0) {
      this.logger.warn(`Performance Alerts: ${summary.alerts.join(', ')}`);
    }
  }
}

// Interfaces
export interface PerformanceMetrics {
  requests: {
    total: number;
    successful: number;
    failed: number;
    averageResponseTime: number;
    slowRequests: number;
  };
  database: {
    queries: number;
    slowQueries: number;
    averageQueryTime: number;
    connectionPoolUsage: number;
  };
  cache: {
    hits: number;
    misses: number;
    hitRate: number;
    evictions: number;
  };
  memory: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
    external: number;
  };
  system: {
    uptime: number;
    cpuUsage: number;
    loadAverage: number[];
  };
}

export interface PerformanceSummary {
  timestamp: string;
  health: number;
  alerts: string[];
  recommendations: string[];
  summary: {
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    cacheHitRate: number;
    slowQueriesCount: number;
    memoryUsageMB: number;
  };
}
