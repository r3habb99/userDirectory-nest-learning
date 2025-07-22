import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../services/prisma/prisma.service';
import { CacheService } from './cache.service';
import { PerformanceMonitorService } from './performance-monitor.service';
import { Prisma, CourseType } from '@prisma/client';

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
          this.logger.debug(
            `Query served from cache: ${queryKey} (${duration}ms)`,
          );
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
  async findStudentsOptimized(
    filters: StudentQueryFilters,
  ): Promise<StudentQueryResult> {
    const cacheKey = this.generateStudentCacheKey(filters);

    return this.executeOptimizedQuery(
      cacheKey,
      async (): Promise<StudentQueryResult> => {
        const {
          page = 1,
          limit = 10,
          sortBy = 'createdAt',
          sortOrder = 'desc',
        } = filters;
        const skip = (page - 1) * limit;

        // Build optimized where clause
        const where: Prisma.StudentWhereInput =
          this.buildOptimizedWhereClause(filters);

        // Use parallel queries for better performance
        const [students, total] = await Promise.all([
          this.prisma.student.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
              [sortBy]: sortOrder,
            } as Prisma.StudentOrderByWithRelationInput,
            select: this.getOptimizedStudentSelect(filters.includeRelations),
          }),
          this.prisma.student.count({ where }),
        ]);

        return {
          students: students as unknown as StudentWithRelations[],
          total,
          page,
          limit,
        };
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
  async getStatisticsOptimized(
    type: 'students' | 'courses' | 'attendance',
  ): Promise<StudentStatistics | CourseStatistics | AttendanceStatistics> {
    const cacheKey = CacheService.generateStatsKey(type);

    return this.executeOptimizedQuery(
      cacheKey,
      async (): Promise<
        StudentStatistics | CourseStatistics | AttendanceStatistics
      > => {
        switch (type) {
          case 'students':
            return this.getStudentStatistics();
          case 'courses':
            return this.getCourseStatistics();
          case 'attendance':
            return this.getAttendanceStatistics();
          default:
            throw new Error(`Unknown statistics type: ${type as string}`);
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
        batch.map((query) =>
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
  invalidateRelatedCache(entity: string, id?: string): void {
    const patterns = this.getCacheInvalidationPatterns(entity, id);

    for (const pattern of patterns) {
      this.cache.deletePattern(pattern);
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
      filters.search || 'no-search',
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
  private buildOptimizedWhereClause(
    filters: StudentQueryFilters,
  ): Prisma.StudentWhereInput {
    const where: Prisma.StudentWhereInput = {};

    // Use indexed fields first for better performance
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.course) {
      where.course = {
        type: filters.course as CourseType,
      };
    }

    if (filters.admissionYear) {
      where.admissionYear = filters.admissionYear;
    }

    // Search should be last as it's most expensive
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { enrollmentNumber: { contains: filters.search } },
        { email: { contains: filters.search } },
        { phone: { contains: filters.search } },
      ];
    }

    return where;
  }

  /**
   * Get optimized select clause based on requirements
   */
  private getOptimizedStudentSelect(
    includeRelations = false,
  ): Prisma.StudentSelect {
    const baseSelect: Prisma.StudentSelect = {
      id: true,
      enrollmentNumber: true,
      name: true,
      email: true,
      phone: true,
      age: true,
      gender: true,
      admissionYear: true,
      passoutYear: true, // graduation year
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
  private async getStudentStatistics(): Promise<StudentStatistics> {
    const [totalStudents, activeStudents, courseStats, yearStats] =
      await Promise.all([
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
  private async getCourseStatistics(): Promise<CourseStatistics> {
    const [totalCourses, activeCourses, courseTypes] = await Promise.all([
      this.prisma.course.count(),
      this.prisma.course.count({ where: { isActive: true } }),
      this.prisma.course.groupBy({
        by: ['type'],
        _count: { id: true },
        where: { isActive: true },
      }),
    ]);

    return {
      totalCourses,
      activeCourses,
      courseTypes: courseTypes.map((ct) => ({
        type: ct.type,
        count: ct._count.id,
      })),
    };
  }

  /**
   * Get attendance statistics
   */
  private async getAttendanceStatistics(): Promise<AttendanceStatistics> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalRecords, presentToday, absentToday] = await Promise.all([
      this.prisma.attendanceRecord.count(),
      this.prisma.attendanceRecord.count({
        where: {
          date: today,
          status: 'PRESENT',
        },
      }),
      this.prisma.attendanceRecord.count({
        where: {
          date: today,
          status: 'ABSENT',
        },
      }),
    ]);

    const attendanceRate =
      presentToday + absentToday > 0
        ? (presentToday / (presentToday + absentToday)) * 100
        : 0;

    return {
      totalRecords,
      presentToday,
      absentToday,
      attendanceRate: Math.round(attendanceRate * 100) / 100,
    };
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

// Type definitions for Prisma operations are used inline above

// Student query result types
interface StudentWithRelations {
  id: string;
  enrollmentNumber: string;
  name: string;
  email: string | null;
  phone: string;
  age: number;
  gender: string;
  admissionYear: number;
  passoutYear: number; // graduation year
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  course?: {
    id: string;
    name: string;
    type: string;
    duration: number;
  };
  admin?: {
    id: string;
    name: string;
    email: string;
  };
}

interface StudentQueryResult {
  students: StudentWithRelations[];
  total: number;
  page: number;
  limit: number;
}

interface StudentStatistics {
  totalStudents: number;
  activeStudents: number;
  courseStats: Array<{
    courseId: string;
    _count: { id: number };
  }>;
  yearStats: Array<{
    admissionYear: number;
    _count: { id: number };
  }>;
}

interface CourseStatistics {
  totalCourses: number;
  activeCourses: number;
  courseTypes: Array<{
    type: string;
    count: number;
  }>;
}

interface AttendanceStatistics {
  totalRecords: number;
  presentToday: number;
  absentToday: number;
  attendanceRate: number;
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
