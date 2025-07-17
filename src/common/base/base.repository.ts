import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../services/prisma/prisma.service';

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

// Base entity interface that all entities should extend
export interface BaseEntity {
  id: string | number;
  createdAt?: Date;
  updatedAt?: Date;
  isActive?: boolean;
}

// Type for Prisma model delegate with better typing
type PrismaModelDelegate<T, CreateInput, UpdateInput, WhereInput> = {
  create: (args: {
    data: CreateInput;
    include?: Record<string, unknown>;
  }) => Promise<T>;
  findUnique: (args: {
    where: { id: string | number } | Partial<WhereInput>;
    include?: Record<string, unknown>;
  }) => Promise<T | null>;
  findFirst: (args: {
    where: WhereInput;
    include?: Record<string, unknown>;
  }) => Promise<T | null>;
  findMany: (args: {
    where?: Partial<WhereInput>;
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
    include?: Record<string, unknown>;
  }) => Promise<T[]>;
  update: (args: {
    where: { id: string | number };
    data: UpdateInput;
    include?: Record<string, unknown>;
  }) => Promise<T>;
  updateMany: (args: {
    where: WhereInput;
    data: Partial<UpdateInput>;
  }) => Promise<{ count: number }>;
  delete: (args: { where: { id: string | number } }) => Promise<T>;
  deleteMany: (args: { where: WhereInput }) => Promise<{ count: number }>;
  count: (args: { where?: Partial<WhereInput> }) => Promise<number>;
  aggregate: (
    args: AggregateOptions<WhereInput>,
  ) => Promise<Record<string, unknown>>;
  groupBy: (
    args: GroupByOptions<WhereInput>,
  ) => Promise<Record<string, unknown>[]>;
};

// Type for aggregate options
type AggregateOptions<WhereInput> = {
  where?: WhereInput;
  _count?: Record<string, boolean>;
  _sum?: Record<string, boolean>;
  _avg?: Record<string, boolean>;
  _min?: Record<string, boolean>;
  _max?: Record<string, boolean>;
};

// Type for group by options
type GroupByOptions<WhereInput> = {
  by: string | string[];
  where?: WhereInput;
  _count?: Record<string, boolean>;
  _sum?: Record<string, boolean>;
  _avg?: Record<string, boolean>;
  _min?: Record<string, boolean>;
  _max?: Record<string, boolean>;
  orderBy?: Record<string, 'asc' | 'desc'>;
  having?: Record<string, unknown>;
};

@Injectable()
export abstract class BaseRepository<
  T extends BaseEntity,
  CreateInput = Partial<T>,
  UpdateInput = Partial<T>,
  WhereInput = Partial<T>,
> {
  protected readonly logger: Logger;
  protected abstract readonly modelName: string;

  constructor(protected readonly prisma: PrismaService) {
    this.logger = new Logger(this.constructor.name);
  }

  /**
   * Get the Prisma model delegate
   */
  protected get model(): PrismaModelDelegate<
    T,
    CreateInput,
    UpdateInput,
    WhereInput
  > {
    const prismaModel = (this.prisma as unknown as Record<string, unknown>)[
      this.modelName
    ];
    if (!prismaModel) {
      throw new Error(`Model ${this.modelName} not found in Prisma client`);
    }
    return prismaModel as PrismaModelDelegate<
      T,
      CreateInput,
      UpdateInput,
      WhereInput
    >;
  }

  /**
   * Create a new record
   */
  async create(
    data: CreateInput,
    include?: Record<string, unknown>,
  ): Promise<T> {
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
  async findById(
    id: string | number,
    include?: Record<string, unknown>,
  ): Promise<T | null> {
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
  async findByUnique(
    where: { id: string | number } | Partial<WhereInput>,
    include?: Record<string, unknown>,
  ): Promise<T | null> {
    try {
      const result = await this.model.findUnique({
        where,
        ...(include && { include }),
      });

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to find ${this.modelName} by unique field:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Find first record matching criteria
   */
  async findFirst(
    where: WhereInput,
    include?: Record<string, unknown>,
  ): Promise<T | null> {
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
    where: Partial<WhereInput> | null = null,
    options: PaginationOptions,
    include?: Record<string, unknown>,
  ): Promise<PaginatedResult<T>> {
    try {
      const { page, limit, sortBy = 'createdAt', sortOrder = 'desc' } = options;
      const skip = (page - 1) * limit;
      const whereClause = where || {};

      const [data, total] = await Promise.all([
        this.model.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          ...(include && { include }),
        }),
        this.model.count({ where: whereClause }),
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
  async findAll(
    where: Partial<WhereInput> | null = null,
    include?: Record<string, unknown>,
    orderBy?: Record<string, 'asc' | 'desc'>,
  ): Promise<T[]> {
    try {
      const whereClause = where || {};
      const result = await this.model.findMany({
        where: whereClause,
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
  async update(
    id: string | number,
    data: UpdateInput,
    include?: Record<string, unknown>,
  ): Promise<T> {
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
  async updateMany(
    where: WhereInput,
    data: Partial<UpdateInput>,
  ): Promise<{ count: number }> {
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
  async delete(id: string | number): Promise<T> {
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
  async softDelete(id: string | number): Promise<T> {
    try {
      this.logger.debug(`Soft deleting ${this.modelName} with ID: ${id}`);

      const result = await this.model.update({
        where: { id },
        data: { isActive: false } as UpdateInput,
      });

      this.logger.debug(`Soft deleted ${this.modelName} with ID: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to soft delete ${this.modelName} ${id}:`,
        error,
      );
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
  async count(where: Partial<WhereInput> | null = null): Promise<number> {
    try {
      const whereClause = where || {};
      const count = await this.model.count({
        where: whereClause,
      });
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
  async executeRaw(query: string, params: unknown[] = []): Promise<unknown> {
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
  async aggregate(
    options: AggregateOptions<WhereInput>,
  ): Promise<Record<string, unknown>> {
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
  async groupBy(
    options: GroupByOptions<WhereInput>,
  ): Promise<Record<string, unknown>[]> {
    try {
      const result = await this.model.groupBy(options);
      return result;
    } catch (error) {
      this.logger.error(`Failed to group by ${this.modelName}:`, error);
      throw error;
    }
  }
}
