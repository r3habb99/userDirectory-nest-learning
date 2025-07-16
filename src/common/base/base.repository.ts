import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../services/prisma/prisma.service';
import { Prisma } from '@prisma/client';

/**
 * Base Repository Class
 * Implements the Repository pattern for data access layer abstraction
 */

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

@Injectable()
export abstract class BaseRepository<T, CreateInput, UpdateInput, WhereInput = any> {
  protected readonly logger: Logger;
  protected abstract readonly modelName: string;

  constructor(protected readonly prisma: PrismaService) {
    this.logger = new Logger(this.constructor.name);
  }

  /**
   * Get the Prisma model delegate
   */
  protected get model(): any {
    return (this.prisma as any)[this.modelName];
  }

  /**
   * Create a new record
   */
  async create(data: CreateInput, include?: any): Promise<T> {
    try {
      this.logger.debug(`Creating ${this.modelName} with data:`, data);
      
      const result = await this.model.create({
        data,
        ...(include && { include }),
      });

      this.logger.debug(`Created ${this.modelName} with ID: ${result.id}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to create ${this.modelName}:`, error);
      throw error;
    }
  }

  /**
   * Find record by ID
   */
  async findById(id: string, include?: any): Promise<T | null> {
    try {
      const result = await this.model.findUnique({
        where: { id },
        ...(include && { include }),
      });

      if (!result) {
        this.logger.debug(`${this.modelName} with ID ${id} not found`);
      }

      return result;
    } catch (error) {
      this.logger.error(`Failed to find ${this.modelName} by ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Find record by unique field
   */
  async findByUnique(where: any, include?: any): Promise<T | null> {
    try {
      const result = await this.model.findUnique({
        where,
        ...(include && { include }),
      });

      return result;
    } catch (error) {
      this.logger.error(`Failed to find ${this.modelName} by unique field:`, error);
      throw error;
    }
  }

  /**
   * Find first record matching criteria
   */
  async findFirst(where: WhereInput, include?: any): Promise<T | null> {
    try {
      const result = await this.model.findFirst({
        where,
        ...(include && { include }),
      });

      return result;
    } catch (error) {
      this.logger.error(`Failed to find first ${this.modelName}:`, error);
      throw error;
    }
  }

  /**
   * Find many records with pagination
   */
  async findMany(
    where: WhereInput = {},
    options: PaginationOptions,
    include?: any,
  ): Promise<PaginatedResult<T>> {
    try {
      const { page, limit, sortBy = 'createdAt', sortOrder = 'desc' } = options;
      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        this.model.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          ...(include && { include }),
        }),
        this.model.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data,
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      };
    } catch (error) {
      this.logger.error(`Failed to find many ${this.modelName}:`, error);
      throw error;
    }
  }

  /**
   * Find all records (without pagination)
   */
  async findAll(where: WhereInput = {}, include?: any, orderBy?: any): Promise<T[]> {
    try {
      const result = await this.model.findMany({
        where,
        ...(include && { include }),
        ...(orderBy && { orderBy }),
      });

      return result;
    } catch (error) {
      this.logger.error(`Failed to find all ${this.modelName}:`, error);
      throw error;
    }
  }

  /**
   * Update record by ID
   */
  async update(id: string, data: UpdateInput, include?: any): Promise<T> {
    try {
      this.logger.debug(`Updating ${this.modelName} ${id} with data:`, data);

      const result = await this.model.update({
        where: { id },
        data,
        ...(include && { include }),
      });

      this.logger.debug(`Updated ${this.modelName} with ID: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to update ${this.modelName} ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update many records
   */
  async updateMany(where: WhereInput, data: Partial<UpdateInput>): Promise<{ count: number }> {
    try {
      const result = await this.model.updateMany({
        where,
        data,
      });

      this.logger.debug(`Updated ${result.count} ${this.modelName} records`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to update many ${this.modelName}:`, error);
      throw error;
    }
  }

  /**
   * Delete record by ID
   */
  async delete(id: string): Promise<T> {
    try {
      this.logger.debug(`Deleting ${this.modelName} with ID: ${id}`);

      const result = await this.model.delete({
        where: { id },
      });

      this.logger.debug(`Deleted ${this.modelName} with ID: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to delete ${this.modelName} ${id}:`, error);
      throw error;
    }
  }

  /**
   * Soft delete (if model supports isActive field)
   */
  async softDelete(id: string): Promise<T> {
    try {
      this.logger.debug(`Soft deleting ${this.modelName} with ID: ${id}`);

      const result = await this.model.update({
        where: { id },
        data: { isActive: false },
      });

      this.logger.debug(`Soft deleted ${this.modelName} with ID: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to soft delete ${this.modelName} ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete many records
   */
  async deleteMany(where: WhereInput): Promise<{ count: number }> {
    try {
      const result = await this.model.deleteMany({
        where,
      });

      this.logger.debug(`Deleted ${result.count} ${this.modelName} records`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to delete many ${this.modelName}:`, error);
      throw error;
    }
  }

  /**
   * Count records
   */
  async count(where: WhereInput = {}): Promise<number> {
    try {
      const count = await this.model.count({ where });
      return count;
    } catch (error) {
      this.logger.error(`Failed to count ${this.modelName}:`, error);
      throw error;
    }
  }

  /**
   * Check if record exists
   */
  async exists(where: WhereInput): Promise<boolean> {
    try {
      const count = await this.model.count({ where });
      return count > 0;
    } catch (error) {
      this.logger.error(`Failed to check if ${this.modelName} exists:`, error);
      throw error;
    }
  }

  /**
   * Execute raw query
   */
  async executeRaw(query: string, params: any[] = []): Promise<any> {
    try {
      const result = await this.prisma.$queryRawUnsafe(query, ...params);
      return result;
    } catch (error) {
      this.logger.error(`Failed to execute raw query:`, error);
      throw error;
    }
  }

  /**
   * Execute transaction
   */
  async transaction<R>(
    operations: (prisma: PrismaService) => Promise<R>,
  ): Promise<R> {
    try {
      return await this.prisma.$transaction(operations);
    } catch (error) {
      this.logger.error(`Transaction failed:`, error);
      throw error;
    }
  }

  /**
   * Aggregate data
   */
  async aggregate(options: {
    where?: WhereInput;
    _count?: any;
    _sum?: any;
    _avg?: any;
    _min?: any;
    _max?: any;
  }): Promise<any> {
    try {
      const result = await this.model.aggregate(options);
      return result;
    } catch (error) {
      this.logger.error(`Failed to aggregate ${this.modelName}:`, error);
      throw error;
    }
  }

  /**
   * Group by field
   */
  async groupBy(options: {
    by: string | string[];
    where?: WhereInput;
    _count?: any;
    _sum?: any;
    _avg?: any;
    _min?: any;
    _max?: any;
    orderBy?: any;
    having?: any;
  }): Promise<any[]> {
    try {
      const result = await this.model.groupBy(options);
      return result;
    } catch (error) {
      this.logger.error(`Failed to group by ${this.modelName}:`, error);
      throw error;
    }
  }
}
