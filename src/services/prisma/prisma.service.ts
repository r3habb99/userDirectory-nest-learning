import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(private readonly configService: ConfigService) {
    super({
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['warn', 'error'],
      errorFormat: 'pretty',
      // Enhanced connection configuration
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    // Configure query optimization middleware
    this.setupQueryOptimization();
  }

  /**
   * Setup query optimization middleware
   */
  private setupQueryOptimization(): void {
    // Query performance monitoring middleware
    this.$use(async (params, next) => {
      const before = Date.now();
      const result = await next(params);
      const after = Date.now();

      const queryTime = after - before;

      // Log slow queries (> 1000ms)
      if (queryTime > 1000) {
        this.logger.warn(
          `Slow query detected: ${params.model}.${params.action} took ${queryTime}ms`,
        );
      }

      // Log query details in development
      if (process.env.NODE_ENV === 'development' && queryTime > 100) {
        this.logger.debug(
          `Query: ${params.model}.${params.action} - ${queryTime}ms`,
        );
      }

      return result;
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Database connected successfully');

      // Set up connection pool settings for MySQL
      await this
        .$executeRaw`SET SESSION sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO'`;

      // Optimize MySQL settings for performance
      await this.$executeRaw`SET SESSION innodb_lock_wait_timeout = 50`;
      await this.$executeRaw`SET SESSION max_execution_time = 30000`;

      this.logger.log('Database optimization settings applied');
    } catch (error) {
      this.logger.error('Failed to connect to database', error);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.$disconnect();
      this.logger.log('Database disconnected successfully');
    } catch (error) {
      this.logger.error('Error disconnecting from database', error);
    }
  }

  /**
   * Health check for database connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error('Database health check failed', error);
      return false;
    }
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats(): Promise<any> {
    try {
      const [studentCount, courseCount, attendanceCount, adminCount] =
        await Promise.all([
          this.student.count(),
          this.course.count(),
          this.attendanceRecord.count(),
          this.admin.count(),
        ]);

      return {
        students: studentCount,
        courses: courseCount,
        attendanceRecords: attendanceCount,
        admins: adminCount,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to get database statistics', error);
      throw error;
    }
  }

  /**
   * Execute transaction with retry logic
   */
  async executeTransaction<T>(
    fn: (prisma: PrismaClient) => Promise<T>,
    maxRetries: number = 3,
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.$transaction(fn);
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(`Transaction attempt ${attempt} failed:`, error);

        if (attempt === maxRetries) {
          break;
        }

        // Wait before retry (exponential backoff)
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000),
        );
      }
    }

    this.logger.error(`Transaction failed after ${maxRetries} attempts`);
    throw lastError!;
  }

  /**
   * Optimize database performance with batch operations
   */
  async batchCreate<T>(
    model: string,
    data: any[],
    batchSize: number = 100,
  ): Promise<T[]> {
    const results: T[] = [];

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const batchResults = await (this as any)[model].createMany({
        data: batch,
        skipDuplicates: true,
      });
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Get connection pool status
   */
  async getConnectionPoolStatus(): Promise<{
    activeConnections: number;
    idleConnections: number;
    totalConnections: number;
  }> {
    try {
      const result = await this.$queryRaw<
        Array<{
          VARIABLE_NAME: string;
          VARIABLE_VALUE: string;
        }>
      >`
        SHOW STATUS WHERE Variable_name IN (
          'Threads_connected',
          'Threads_running',
          'Max_used_connections'
        )
      `;

      const stats = result.reduce(
        (acc, row) => {
          acc[row.VARIABLE_NAME] = parseInt(row.VARIABLE_VALUE, 10);
          return acc;
        },
        {} as Record<string, number>,
      );

      return {
        activeConnections: stats.Threads_running || 0,
        idleConnections:
          (stats.Threads_connected || 0) - (stats.Threads_running || 0),
        totalConnections: stats.Threads_connected || 0,
      };
    } catch (error) {
      this.logger.error('Failed to get connection pool status', error);
      return {
        activeConnections: 0,
        idleConnections: 0,
        totalConnections: 0,
      };
    }
  }

  /**
   * Analyze query performance
   */
  async analyzeQueryPerformance(query: string): Promise<any> {
    try {
      const explainResult = await this.$queryRawUnsafe(`EXPLAIN ${query}`);
      return explainResult;
    } catch (error) {
      this.logger.error('Failed to analyze query performance', error);
      throw error;
    }
  }

  async cleanDatabase(): Promise<void> {
    if (process.env.NODE_ENV === 'production') return;

    const models = Reflect.ownKeys(this).filter((key) => key[0] !== '_');

    await Promise.all(
      models.map((modelKey) => {
        const model = this[modelKey as keyof this];
        if (model && typeof model === 'object' && 'deleteMany' in model) {
          const typedModel = model as { deleteMany: () => Promise<unknown> };
          if (typeof typedModel.deleteMany === 'function') {
            return typedModel.deleteMany();
          }
        }
        return Promise.resolve();
      }),
    );
  }
}
