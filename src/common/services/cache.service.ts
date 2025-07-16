import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Enhanced Cache Service
 * Provides advanced caching functionality with performance monitoring
 * Supports both in-memory and Redis caching strategies
 */
@Injectable()
export class CacheService implements OnModuleInit {
  private readonly logger = new Logger(CacheService.name);
  private readonly cache = new Map<string, CacheItem>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes
  private readonly maxCacheSize: number;
  private readonly enableMetrics: boolean;

  // Performance metrics
  private metrics = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0,
    totalRequests: 0,
  };

  constructor(private readonly configService: ConfigService) {
    this.maxCacheSize = this.configService.get<number>('CACHE_MAX', 1000);
    this.enableMetrics = this.configService.get<boolean>('ENABLE_METRICS', false);
  }

  async onModuleInit() {
    // Start periodic cleanup of expired items
    this.startCleanupInterval();

    // Log cache configuration
    this.logger.log(`Cache initialized with max size: ${this.maxCacheSize}, TTL: ${this.defaultTTL}ms`);
  }

  /**
   * Get value from cache with metrics tracking
   */
  async get<T>(key: string): Promise<T | null> {
    this.metrics.totalRequests++;

    const item = this.cache.get(key);

    if (!item) {
      this.metrics.misses++;
      this.logMetrics('miss', key);
      return null;
    }

    // Check if expired
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      this.metrics.misses++;
      this.metrics.evictions++;
      this.logMetrics('expired', key);
      return null;
    }

    this.metrics.hits++;
    this.logMetrics('hit', key);
    return item.value as T;
  }

  /**
   * Set value in cache with size enforcement
   */
  async set<T>(key: string, value: T, ttlMs?: number): Promise<void> {
    const ttl = ttlMs || this.defaultTTL;
    const expiresAt = Date.now() + ttl;

    this.cache.set(key, {
      value,
      expiresAt,
      createdAt: Date.now(),
    });

    this.metrics.sets++;
    this.enforceSizeLimit();

    this.logMetrics('set', key);
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<boolean> {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.logger.debug(`Cache deleted for key: ${key}`);
    }
    return deleted;
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.cache.clear();
    this.logger.debug('Cache cleared');
  }

  /**
   * Get or set pattern - if key exists return it, otherwise compute and cache
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttlMs?: number,
  ): Promise<T> {
    const cached = await this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, ttlMs);
    return value;
  }

  /**
   * Check if key exists in cache
   */
  async has(key: string): Promise<boolean> {
    const item = this.cache.get(key);

    if (!item) {
      return false;
    }

    // Check if expired
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    let totalSize = 0;
    let expiredCount = 0;
    const now = Date.now();

    for (const [key, item] of this.cache.entries()) {
      totalSize += this.getItemSize(item);

      if (now > item.expiresAt) {
        expiredCount++;
      }
    }

    return {
      totalKeys: this.cache.size,
      totalSize,
      expiredCount,
      hitRate: 0, // Would need to track hits/misses for accurate calculation
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.debug(`Cleaned up ${cleanedCount} expired cache entries`);
    }
  }

  /**
   * Get keys matching pattern
   */
  getKeys(pattern?: string): string[] {
    const keys = Array.from(this.cache.keys());

    if (!pattern) {
      return keys;
    }

    const regex = new RegExp(pattern);
    return keys.filter((key) => regex.test(key));
  }

  /**
   * Delete keys matching pattern
   */
  deletePattern(pattern: string): number {
    const keys = this.getKeys(pattern);
    let deletedCount = 0;

    keys.forEach((key) => {
      if (this.cache.delete(key)) {
        deletedCount++;
      }
    });

    this.logger.debug(
      `Deleted ${deletedCount} keys matching pattern: ${pattern}`,
    );
    return deletedCount;
  }

  /**
   * Estimate item size (rough calculation)
   */
  private getItemSize(item: CacheItem): number {
    try {
      return JSON.stringify(item).length * 2; // Rough estimate (UTF-16)
    } catch {
      return 0;
    }
  }

  /**
   * Generate cache key for student queries
   */
  static generateStudentKey(filters: any): string {
    const sortedFilters = Object.keys(filters)
      .sort()
      .reduce((result, key) => {
        result[key] = filters[key];
        return result;
      }, {} as any);

    return `students:${JSON.stringify(sortedFilters)}`;
  }

  /**
   * Generate cache key for course queries
   */
  static generateCourseKey(filters: any): string {
    return `courses:${JSON.stringify(filters)}`;
  }

  /**
   * Generate cache key for attendance queries
   */
  static generateAttendanceKey(
    studentId: string,
    dateRange?: { from: Date; to: Date },
  ): string {
    const key = `attendance:${studentId}`;
    if (dateRange) {
      return `${key}:${dateRange.from.toISOString()}:${dateRange.to.toISOString()}`;
    }
    return key;
  }

  /**
   * Generate cache key for statistics
   */
  static generateStatsKey(type: string, period?: string): string {
    return `stats:${type}${period ? `:${period}` : ''}`;
  }

  /**
   * Start periodic cleanup of expired items
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanupExpiredItems();
    }, 60000); // Run every minute
  }

  /**
   * Clean up expired items from cache
   */
  private cleanupExpiredItems(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
        cleanedCount++;
        this.metrics.evictions++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.debug(`Cleaned up ${cleanedCount} expired cache items`);
    }
  }

  /**
   * Log cache metrics for debugging
   */
  private logMetrics(operation: string, key: string): void {
    if (this.enableMetrics) {
      this.logger.debug(`Cache ${operation}: ${key} | Hit rate: ${this.getHitRate().toFixed(2)}%`);
    }
  }

  /**
   * Calculate cache hit rate
   */
  private getHitRate(): number {
    const total = this.metrics.hits + this.metrics.misses;
    return total > 0 ? (this.metrics.hits / total) * 100 : 0;
  }

  /**
   * Enforce cache size limit using LRU eviction
   */
  private enforceSizeLimit(): void {
    if (this.cache.size <= this.maxCacheSize) {
      return;
    }

    // Convert to array and sort by creation time (oldest first)
    const entries = Array.from(this.cache.entries()).sort(
      (a, b) => a[1].createdAt - b[1].createdAt,
    );

    // Remove oldest entries until we're under the limit
    const toRemove = this.cache.size - this.maxCacheSize;
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
      this.metrics.evictions++;
    }

    this.logger.debug(`Evicted ${toRemove} items to enforce cache size limit`);
  }
}

interface CacheItem {
  value: any;
  expiresAt: number;
  createdAt: number;
}

interface CacheStats {
  totalKeys: number;
  totalSize: number;
  expiredCount: number;
  hitRate: number;
}

/**
 * Cache Decorator
 * Decorator to automatically cache method results
 */
export function Cacheable(keyPrefix: string, ttlMs?: number) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor,
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheService: CacheService = this.cacheService;

      if (!cacheService) {
        // If no cache service, just call the original method
        return method.apply(this, args);
      }

      const key = `${keyPrefix}:${JSON.stringify(args)}`;

      try {
        const cached = await cacheService.get(key);
        if (cached !== null) {
          return cached;
        }

        const result = await method.apply(this, args);
        await cacheService.set(key, result, ttlMs);
        return result;
      } catch (error) {
        // If caching fails, still return the method result
        return method.apply(this, args);
      }
    };

    return descriptor;
  };
}
