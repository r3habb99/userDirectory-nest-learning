import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../services/prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Health Check Service
 * Provides comprehensive health monitoring for the application
 */
@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Comprehensive health check
   */
  async getHealthStatus(): Promise<HealthStatus> {
    const startTime = Date.now();

    const [databaseHealth, diskHealth, memoryHealth, uploadsHealth] =
      await Promise.allSettled([
        this.checkDatabase(),
        this.checkDiskSpace(),
        this.checkMemoryUsage(),
        this.checkUploadsDirectory(),
      ]);

    const responseTime = Date.now() - startTime;

    return {
      status: this.determineOverallStatus([
        databaseHealth,
        diskHealth,
        memoryHealth,
        uploadsHealth,
      ]),
      timestamp: new Date().toISOString(),
      responseTime,
      checks: {
        database: this.getCheckResult(databaseHealth),
        disk: this.getCheckResult(diskHealth),
        memory: this.getCheckResult(memoryHealth),
        uploads: this.getCheckResult(uploadsHealth),
      },
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };
  }

  /**
   * Check database connectivity and performance
   */
  private async checkDatabase(): Promise<HealthCheck> {
    try {
      const startTime = Date.now();
      const isHealthy = await this.prisma.healthCheck();
      const responseTime = Date.now() - startTime;

      if (!isHealthy) {
        return {
          status: 'unhealthy',
          message: 'Database connection failed',
          responseTime,
        };
      }

      // Get database statistics
      const stats = (await this.prisma.getDatabaseStats()) as Record<
        string,
        unknown
      >;

      return {
        status: responseTime < 1000 ? 'healthy' : 'degraded',
        message:
          responseTime < 1000 ? 'Database is responsive' : 'Database is slow',
        responseTime,
        details: stats,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Database error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTime: 0,
      };
    }
  }

  /**
   * Check available disk space
   */
  private checkDiskSpace(): Promise<HealthCheck> {
    try {
      const freeSpace = this.getFreeDiskSpace();
      const freeSpaceGB = freeSpace / (1024 * 1024 * 1024);

      const status =
        freeSpaceGB > 1
          ? 'healthy'
          : freeSpaceGB > 0.5
            ? 'degraded'
            : 'unhealthy';

      return Promise.resolve({
        status,
        message: `${freeSpaceGB.toFixed(2)} GB free space available`,
        details: {
          freeSpaceGB: freeSpaceGB.toFixed(2),
          totalSpaceGB: 'N/A', // Would need additional system calls
        },
      });
    } catch (error) {
      return Promise.resolve({
        status: 'unhealthy',
        message: `Disk check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }

  /**
   * Check memory usage
   */
  private checkMemoryUsage(): Promise<HealthCheck> {
    try {
      const memUsage = process.memoryUsage();
      const totalMemMB = memUsage.heapTotal / (1024 * 1024);
      const usedMemMB = memUsage.heapUsed / (1024 * 1024);
      const memoryUsagePercent = (usedMemMB / totalMemMB) * 100;

      const status =
        memoryUsagePercent < 80
          ? 'healthy'
          : memoryUsagePercent < 90
            ? 'degraded'
            : 'unhealthy';

      return Promise.resolve({
        status,
        message: `Memory usage: ${memoryUsagePercent.toFixed(1)}%`,
        details: {
          heapUsedMB: usedMemMB.toFixed(2),
          heapTotalMB: totalMemMB.toFixed(2),
          usagePercent: memoryUsagePercent.toFixed(1),
          rss: (memUsage.rss / (1024 * 1024)).toFixed(2),
          external: (memUsage.external / (1024 * 1024)).toFixed(2),
        },
      });
    } catch (error) {
      return Promise.resolve({
        status: 'unhealthy',
        message: `Memory check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }

  /**
   * Check uploads directory accessibility
   */
  private checkUploadsDirectory(): Promise<HealthCheck> {
    try {
      const uploadsPath = path.join(process.cwd(), 'uploads');

      // Check if directory exists
      if (!fs.existsSync(uploadsPath)) {
        return Promise.resolve({
          status: 'unhealthy',
          message: 'Uploads directory does not exist',
        });
      }

      // Check if directory is writable
      fs.accessSync(uploadsPath, fs.constants.W_OK);

      // Get directory size
      const dirSize = this.getDirectorySize(uploadsPath);
      const dirSizeMB = dirSize / (1024 * 1024);

      return Promise.resolve({
        status: 'healthy',
        message: 'Uploads directory is accessible',
        details: {
          path: uploadsPath,
          sizeMB: dirSizeMB.toFixed(2),
          writable: true,
        },
      });
    } catch (error) {
      return Promise.resolve({
        status: 'unhealthy',
        message: `Uploads directory check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }

  /**
   * Get basic system metrics
   */
  getMetrics(): Promise<SystemMetrics> {
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();

    return Promise.resolve({
      timestamp: new Date().toISOString(),
      uptime: {
        seconds: uptime,
        human: this.formatUptime(uptime),
      },
      memory: {
        heapUsedMB: (memUsage.heapUsed / (1024 * 1024)).toFixed(2),
        heapTotalMB: (memUsage.heapTotal / (1024 * 1024)).toFixed(2),
        rssMB: (memUsage.rss / (1024 * 1024)).toFixed(2),
        externalMB: (memUsage.external / (1024 * 1024)).toFixed(2),
      },
      process: {
        pid: process.pid,
        version: process.version,
        platform: process.platform,
        arch: process.arch,
      },
    });
  }

  /**
   * Helper methods
   */
  private determineOverallStatus(
    results: PromiseSettledResult<HealthCheck>[],
  ): 'healthy' | 'degraded' | 'unhealthy' {
    const statuses = results.map((result) =>
      result.status === 'fulfilled' ? result.value.status : 'unhealthy',
    );

    if (statuses.includes('unhealthy')) return 'unhealthy';
    if (statuses.includes('degraded')) return 'degraded';
    return 'healthy';
  }

  private getCheckResult(
    result: PromiseSettledResult<HealthCheck>,
  ): HealthCheck {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    return {
      status: 'unhealthy',
      message: `Check failed: ${result.reason}`,
    };
  }

  private getFreeDiskSpace(): number {
    // This is a simplified implementation
    // In production, you might want to use a library like 'node-disk-info'
    try {
      // Note: fs.statSync is used here for directory validation,
      // but actual free space calculation would require platform-specific APIs
      fs.statSync(process.cwd());
      return 1024 * 1024 * 1024; // Return 1GB as placeholder
    } catch {
      return 0;
    }
  }

  private getDirectorySize(dirPath: string): number {
    let totalSize = 0;
    try {
      const files = fs.readdirSync(dirPath);
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
          totalSize += this.getDirectorySize(filePath);
        } else {
          totalSize += stats.size;
        }
      }
    } catch (error) {
      this.logger.warn(
        `Error calculating directory size for ${dirPath}:`,
        error,
      );
    }
    return totalSize;
  }

  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    return `${days}d ${hours}h ${minutes}m ${secs}s`;
  }
}

// Interfaces
interface HealthStatus {
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

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  responseTime?: number;
  details?: any;
}

interface SystemMetrics {
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
