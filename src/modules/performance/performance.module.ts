import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheService } from '../../common/services/cache.service';
import { PerformanceMonitorService } from '../../common/services/performance-monitor.service';
import { QueryOptimizerService } from '../../common/services/query-optimizer.service';
import { HealthService } from '../../common/services/health.service';
import { performanceConfig } from '../../common/config/performance.config';
import {
  PerformanceMiddleware,
  DatabasePerformanceMiddleware,
  CachePerformanceMiddleware,
  MemoryMonitoringMiddleware,
  RequestSizeMiddleware,
  PerformanceRateLimitMiddleware,
} from '../../common/middleware/performance.middleware';

/**
 * Performance Module
 * Provides comprehensive performance monitoring, caching, and optimization services
 */
@Global()
@Module({
  imports: [
    ConfigModule.forFeature(performanceConfig),
  ],
  providers: [
    // Core performance services
    CacheService,
    PerformanceMonitorService,
    QueryOptimizerService,
    HealthService,
    
    // Performance middleware
    PerformanceMiddleware,
    DatabasePerformanceMiddleware,
    CachePerformanceMiddleware,
    MemoryMonitoringMiddleware,
    RequestSizeMiddleware,
    PerformanceRateLimitMiddleware,
  ],
  exports: [
    CacheService,
    PerformanceMonitorService,
    QueryOptimizerService,
    HealthService,
    PerformanceMiddleware,
    DatabasePerformanceMiddleware,
    CachePerformanceMiddleware,
    MemoryMonitoringMiddleware,
    RequestSizeMiddleware,
    PerformanceRateLimitMiddleware,
  ],
})
export class PerformanceModule {}
