import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../services/prisma/prisma.service';
import { CacheService } from './cache.service';
import { PerformanceMonitorService } from './performance-monitor.service';

/**
 * Query Optimization Service
 * Provides intelligent query optimization and caching strategies
 */
@Injectable()
export class QueryOptimizerService {
  private readonly logger = new Logger(QueryOptimizerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly performanceMonitor: PerformanceMonitorService,
  ) {}

  /**
   * Execute optimized query with caching
   */
  async executeOptimizedQuery<T>(
    queryKey: string,
    queryFn: () => Promise<T>,
    options: QueryOptions = {},
  ): Promise<T> {
    const {
      cacheTTL = 5 * 60 * 1000, // 5 minutes default
      enableCache = true,
      enableMetrics = true,
    } = options;

    const startTime = Date.now();

    try {
      // Try cache first if enabled
      if (enableCache) {
        const cached = await this.cache.get<T>(queryKey);
        if (cached !== null) {
          const duration = Date.now() - startTime;
          if (enableMetrics) {
            this.performanceMonitor.recordQuery(duration);
          }
          this.logger.debug(`Query served from cache: ${queryKey} (${duration}ms)`);
          return cached;
        }
      }

      // Execute query
      const result = await queryFn();
      const duration = Date.now() - startTime;

      // Cache result if enabled
      if (enableCache) {
        await this.cache.set(queryKey, result, cacheTTL);
      }

      // Record metrics
      if (enableMetrics) {
        this.performanceMonitor.recordQuery(duration);
      }

      this.logger.debug(`Query executed: ${queryKey} (${duration}ms)`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      if (enableMetrics) {
        this.performanceMonitor.recordQuery(duration);
      }
      this.logger.error(`Query failed: ${queryKey} (${duration}ms)`, error);
      throw error;
    }
  }

  /**
   * Optimized student queries with intelligent caching
   */
  async findStudentsOptimized(filters: StudentQueryFilters): Promise<any> {
    const cacheKey = this.generateStudentCacheKey(filters);
    
    return this.executeOptimizedQuery(
      cacheKey,
      async () => {
        const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = filters;
        const skip = (page - 1) * limit;

        // Build optimized where clause
        const where = this.buildOptimizedWhereClause(filters);

        // Use parallel queries for better performance
        const [students, total] = await Promise.all([
          this.prisma.student.findMany({
            where,
            skip,
            take: limit,
            orderBy: { [sortBy]: sortOrder },
            select: this.getOptimizedStudentSelect(filters.includeRelations),
          }),
          this.prisma.student.count({ where }),
        ]);

        return { students, total, page, limit };
      },
      {
        cacheTTL: this.calculateCacheTTL(filters),
        enableCache: this.shouldEnableCache(filters),
      },
    );
  }

  /**
   * Optimized statistics queries with aggressive caching
   */
  async getStatisticsOptimized(type: 'students' | 'courses' | 'attendance'): Promise<any> {
    const cacheKey = CacheService.generateStatsKey(type);
    
    return this.executeOptimizedQuery(
      cacheKey,
      async () => {
        switch (type) {
          case 'students':
            return this.getStudentStatistics();
          case 'courses':
            return this.getCourseStatistics();
          case 'attendance':
            return this.getAttendanceStatistics();
          default:
            throw new Error(`Unknown statistics type: ${type}`);
        }
      },
      {
        cacheTTL: 10 * 60 * 1000, // 10 minutes for statistics
        enableCache: true,
      },
    );
  }

  /**
   * Batch query optimization for multiple related queries
   */
  async executeBatchQueries<T>(
    queries: BatchQuery<T>[],
    options: BatchQueryOptions = {},
  ): Promise<T[]> {
    const { enableParallel = true, maxConcurrency = 5 } = options;

    if (!enableParallel) {
      // Execute sequentially
      const results: T[] = [];
      for (const query of queries) {
        const result = await this.executeOptimizedQuery(
          query.key,
          query.queryFn,
          query.options,
        );
        results.push(result);
      }
      return results;
    }

    // Execute in parallel with concurrency limit
    const results: T[] = [];
    for (let i = 0; i < queries.length; i += maxConcurrency) {
      const batch = queries.slice(i, i + maxConcurrency);
      const batchResults = await Promise.all(
        batch.map(query =>
          this.executeOptimizedQuery(query.key, query.queryFn, query.options),
        ),
      );
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Invalidate related cache entries
   */
  async invalidateRelatedCache(entity: string, id?: string): Promise<void> {
    const patterns = this.getCacheInvalidationPatterns(entity, id);
    
    for (const pattern of patterns) {
      await this.cache.invalidatePattern(pattern);
    }

    this.logger.debug(`Invalidated cache for entity: ${entity}, id: ${id}`);
  }

  /**
   * Generate optimized cache key for student queries
   */
  private generateStudentCacheKey(filters: StudentQueryFilters): string {
    const keyParts = [
      'students',
      filters.course || 'all',
      filters.admissionYear || 'all',
      filters.isActive !== undefined ? filters.isActive.toString() : 'all',
      filters.search || 'nosearch',
      filters.page || 1,
      filters.limit || 10,
      filters.sortBy || 'createdAt',
      filters.sortOrder || 'desc',
    ];
    
    return keyParts.join(':');
  }

  /**
   * Build optimized where clause with proper indexing hints
   */
  private buildOptimizedWhereClause(filters: StudentQueryFilters): any {
    const where: any = {};

    // Use indexed fields first for better performance
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.course) {
      where.course = { type: filters.course };
    }

    if (filters.admissionYear) {
      where.admissionYear = filters.admissionYear;
    }

    // Search should be last as it's most expensive
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { enrollmentNumber: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  /**
   * Get optimized select clause based on requirements
   */
  private getOptimizedStudentSelect(includeRelations = false): any {
    const baseSelect = {
      id: true,
      enrollmentNumber: true,
      name: true,
      email: true,
      phone: true,
      age: true,
      gender: true,
      admissionYear: true,
      passoutYear: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    };

    if (!includeRelations) {
      return baseSelect;
    }

    return {
      ...baseSelect,
      course: {
        select: {
          id: true,
          name: true,
          type: true,
          duration: true,
        },
      },
      admin: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    };
  }

  /**
   * Calculate appropriate cache TTL based on query characteristics
   */
  private calculateCacheTTL(filters: StudentQueryFilters): number {
    // More specific queries can be cached longer
    let ttl = 5 * 60 * 1000; // 5 minutes base

    if (filters.search) {
      // Search results change frequently
      ttl = 2 * 60 * 1000; // 2 minutes
    } else if (filters.course || filters.admissionYear) {
      // Filtered results are more stable
      ttl = 10 * 60 * 1000; // 10 minutes
    }

    return ttl;
  }

  /**
   * Determine if caching should be enabled for this query
   */
  private shouldEnableCache(filters: StudentQueryFilters): boolean {
    // Disable cache for real-time sensitive queries
    if (filters.realTime) {
      return false;
    }

    // Enable cache for most queries
    return true;
  }

  /**
   * Get student statistics with optimized queries
   */
  private async getStudentStatistics(): Promise<any> {
    const [totalStudents, activeStudents, courseStats, yearStats] = await Promise.all([
      this.prisma.student.count(),
      this.prisma.student.count({ where: { isActive: true } }),
      this.prisma.student.groupBy({
        by: ['courseId'],
        _count: { id: true },
        where: { isActive: true },
      }),
      this.prisma.student.groupBy({
        by: ['admissionYear'],
        _count: { id: true },
        where: { isActive: true },
        orderBy: { admissionYear: 'desc' },
      }),
    ]);

    return {
      totalStudents,
      activeStudents,
      courseStats,
      yearStats,
    };
  }

  /**
   * Get course statistics
   */
  private async getCourseStatistics(): Promise<any> {
    return this.prisma.course.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        _count: {
          select: {
            students: { where: { isActive: true } },
          },
        },
      },
    });
  }

  /**
   * Get attendance statistics
   */
  private async getAttendanceStatistics(): Promise<any> {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    return this.prisma.attendanceRecord.groupBy({
      by: ['status'],
      _count: { id: true },
      where: {
        date: {
          gte: startOfMonth,
          lte: today,
        },
      },
    });
  }

  /**
   * Get cache invalidation patterns for an entity
   */
  private getCacheInvalidationPatterns(entity: string, id?: string): string[] {
    const patterns: string[] = [];

    switch (entity) {
      case 'student':
        patterns.push('students:*', 'stats:students*');
        if (id) {
          patterns.push(`student:${id}*`);
        }
        break;
      case 'course':
        patterns.push('courses:*', 'stats:courses*', 'students:*');
        break;
      case 'attendance':
        patterns.push('attendance:*', 'stats:attendance*');
        break;
    }

    return patterns;
  }
}

// Interfaces
export interface QueryOptions {
  cacheTTL?: number;
  enableCache?: boolean;
  enableMetrics?: boolean;
}

export interface StudentQueryFilters {
  course?: string;
  admissionYear?: number;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  includeRelations?: boolean;
  realTime?: boolean;
}

export interface BatchQuery<T> {
  key: string;
  queryFn: () => Promise<T>;
  options?: QueryOptions;
}

export interface BatchQueryOptions {
  enableParallel?: boolean;
  maxConcurrency?: number;
}
