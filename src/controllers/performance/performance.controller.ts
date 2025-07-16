import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PerformanceMonitorService } from '../../common/services/performance-monitor.service';
import { CacheService } from '../../common/services/cache.service';
import { HealthService } from '../../common/services/health.service';
import { PrismaService } from '../../services/prisma/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/types/auth.types';
import { ApiStandardResponses } from '../../common/decorators/swagger.decorators';

/**
 * Performance Controller
 * Provides endpoints for monitoring application performance and health
 */
@ApiTags('Performance')
@Controller('performance')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
export class PerformanceController {
  constructor(
    private readonly performanceMonitor: PerformanceMonitorService,
    private readonly cache: CacheService,
    private readonly health: HealthService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('metrics')
  @ApiOperation({
    summary: 'Get performance metrics',
    description: 'Retrieve comprehensive performance metrics including request times, cache hit rates, and system resources',
  })
  @ApiResponse({
    status: 200,
    description: 'Performance metrics retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Performance metrics retrieved successfully',
        statusCode: 200,
        data: {
          requests: {
            total: 1250,
            successful: 1200,
            failed: 50,
            averageResponseTime: 245,
            slowRequests: 15,
          },
          database: {
            queries: 2500,
            slowQueries: 8,
            averageQueryTime: 125,
            connectionPoolUsage: 65,
          },
          cache: {
            hits: 850,
            misses: 150,
            hitRate: 85.0,
            evictions: 25,
          },
          memory: {
            heapUsed: 134217728,
            heapTotal: 268435456,
            rss: 201326592,
            external: 8388608,
          },
          system: {
            uptime: 86400,
            cpuUsage: 45.2,
            loadAverage: [1.2, 1.5, 1.8],
          },
        },
      },
    },
  })
  @ApiStandardResponses()
  async getMetrics() {
    const metrics = this.performanceMonitor.getMetrics();
    
    return {
      success: true,
      message: 'Performance metrics retrieved successfully',
      statusCode: 200,
      data: metrics,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('summary')
  @ApiOperation({
    summary: 'Get performance summary',
    description: 'Retrieve a high-level performance summary with health score and recommendations',
  })
  @ApiResponse({
    status: 200,
    description: 'Performance summary retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Performance summary retrieved successfully',
        statusCode: 200,
        data: {
          timestamp: '2024-01-15T10:30:00.000Z',
          health: 85,
          alerts: ['High memory usage detected'],
          recommendations: ['Consider increasing cache TTL'],
          summary: {
            totalRequests: 1250,
            averageResponseTime: 245,
            errorRate: 4.0,
            cacheHitRate: 85.0,
            slowQueriesCount: 8,
            memoryUsageMB: 128,
          },
        },
      },
    },
  })
  @ApiStandardResponses()
  async getSummary() {
    const summary = this.performanceMonitor.getPerformanceSummary();
    
    return {
      success: true,
      message: 'Performance summary retrieved successfully',
      statusCode: 200,
      data: summary,
    };
  }

  @Get('health')
  @ApiOperation({
    summary: 'Get system health status',
    description: 'Comprehensive health check including database, disk, memory, and uploads directory',
  })
  @ApiResponse({
    status: 200,
    description: 'Health status retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Health status retrieved successfully',
        statusCode: 200,
        data: {
          status: 'healthy',
          timestamp: '2024-01-15T10:30:00.000Z',
          responseTime: 45,
          checks: {
            database: {
              status: 'healthy',
              message: 'Database is responsive',
              responseTime: 25,
            },
            disk: {
              status: 'healthy',
              message: 'Sufficient disk space available',
            },
            memory: {
              status: 'healthy',
              message: 'Memory usage within normal limits',
            },
            uploads: {
              status: 'healthy',
              message: 'Uploads directory is accessible',
            },
          },
          version: '1.0.0',
          environment: 'development',
        },
      },
    },
  })
  @ApiStandardResponses()
  async getHealth() {
    const healthStatus = await this.health.getHealthStatus();
    
    return {
      success: true,
      message: 'Health status retrieved successfully',
      statusCode: 200,
      data: healthStatus,
    };
  }

  @Get('cache/stats')
  @ApiOperation({
    summary: 'Get cache statistics',
    description: 'Detailed cache performance statistics including hit rates and memory usage',
  })
  @ApiResponse({
    status: 200,
    description: 'Cache statistics retrieved successfully',
  })
  @ApiStandardResponses()
  async getCacheStats() {
    const stats = await this.cache.getStats();
    
    return {
      success: true,
      message: 'Cache statistics retrieved successfully',
      statusCode: 200,
      data: stats,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('database/stats')
  @ApiOperation({
    summary: 'Get database statistics',
    description: 'Database performance statistics including connection pool status and query metrics',
  })
  @ApiResponse({
    status: 200,
    description: 'Database statistics retrieved successfully',
  })
  @ApiStandardResponses()
  async getDatabaseStats() {
    const [dbStats, poolStatus] = await Promise.all([
      this.prisma.getDatabaseStats(),
      this.prisma.getConnectionPoolStatus(),
    ]);
    
    return {
      success: true,
      message: 'Database statistics retrieved successfully',
      statusCode: 200,
      data: {
        ...dbStats,
        connectionPool: poolStatus,
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Post('cache/clear')
  @ApiOperation({
    summary: 'Clear application cache',
    description: 'Clear all cached data to free memory and force fresh data retrieval',
  })
  @ApiResponse({
    status: 200,
    description: 'Cache cleared successfully',
  })
  @ApiStandardResponses()
  async clearCache() {
    await this.cache.clear();
    
    return {
      success: true,
      message: 'Cache cleared successfully',
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('metrics/reset')
  @ApiOperation({
    summary: 'Reset performance metrics',
    description: 'Reset all performance counters and metrics to zero',
  })
  @ApiResponse({
    status: 200,
    description: 'Performance metrics reset successfully',
  })
  @ApiStandardResponses()
  async resetMetrics() {
    this.performanceMonitor.resetMetrics();
    
    return {
      success: true,
      message: 'Performance metrics reset successfully',
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('system/info')
  @ApiOperation({
    summary: 'Get system information',
    description: 'Retrieve detailed system information including Node.js version, memory usage, and uptime',
  })
  @ApiResponse({
    status: 200,
    description: 'System information retrieved successfully',
  })
  @ApiStandardResponses()
  async getSystemInfo() {
    const systemMetrics = await this.health.getMetrics();
    
    return {
      success: true,
      message: 'System information retrieved successfully',
      statusCode: 200,
      data: systemMetrics,
    };
  }
}
