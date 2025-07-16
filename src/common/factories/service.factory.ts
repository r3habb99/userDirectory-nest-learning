import { Injectable, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { BaseService } from '../base/base.service';

/**
 * Service Factory
 * Implements the Factory pattern for creating service instances
 */

export interface ServiceConfig {
  name: string;
  type: Type<any>;
  dependencies?: string[];
}

@Injectable()
export class ServiceFactory {
  private readonly serviceRegistry = new Map<string, ServiceConfig>();
  private readonly serviceInstances = new Map<string, any>();

  constructor(private readonly moduleRef: ModuleRef) {}

  /**
   * Register a service type
   */
  registerService(config: ServiceConfig): void {
    this.serviceRegistry.set(config.name, config);
  }

  /**
   * Create or get service instance
   */
  async getService<T>(serviceName: string): Promise<T> {
    // Return cached instance if exists
    if (this.serviceInstances.has(serviceName)) {
      return this.serviceInstances.get(serviceName);
    }

    const config = this.serviceRegistry.get(serviceName);
    if (!config) {
      throw new Error(`Service '${serviceName}' not registered`);
    }

    try {
      // Get service instance from NestJS DI container
      const serviceInstance = await this.moduleRef.get(config.type, {
        strict: false,
      });

      // Cache the instance
      this.serviceInstances.set(serviceName, serviceInstance);

      return serviceInstance;
    } catch (error) {
      throw new Error(`Failed to create service '${serviceName}': ${error}`);
    }
  }

  /**
   * Create service with custom dependencies
   */
  async createServiceWithDependencies<T>(
    serviceType: Type<T>,
    dependencies: any[],
  ): Promise<T> {
    try {
      // Create instance with provided dependencies
      return new serviceType(...dependencies);
    } catch (error) {
      throw new Error(`Failed to create service with dependencies: ${error}`);
    }
  }

  /**
   * Get all registered services
   */
  getRegisteredServices(): string[] {
    return Array.from(this.serviceRegistry.keys());
  }

  /**
   * Clear service cache
   */
  clearCache(): void {
    this.serviceInstances.clear();
  }

  /**
   * Remove service from registry
   */
  unregisterService(serviceName: string): boolean {
    this.serviceInstances.delete(serviceName);
    return this.serviceRegistry.delete(serviceName);
  }
}

/**
 * Repository Factory
 * Factory for creating repository instances
 */
@Injectable()
export class RepositoryFactory {
  private readonly repositoryInstances = new Map<string, any>();

  constructor(private readonly moduleRef: ModuleRef) {}

  /**
   * Get repository instance by model name
   */
  async getRepository<T>(modelName: string): Promise<T> {
    const cacheKey = `${modelName}Repository`;

    if (this.repositoryInstances.has(cacheKey)) {
      return this.repositoryInstances.get(cacheKey);
    }

    try {
      // Try to get repository from DI container
      const repositoryClass = await this.moduleRef.get(
        `${modelName}Repository`,
        { strict: false },
      );
      this.repositoryInstances.set(cacheKey, repositoryClass);
      return repositoryClass;
    } catch (error) {
      throw new Error(`Repository for model '${modelName}' not found`);
    }
  }

  /**
   * Create generic repository for any model
   */
  createGenericRepository<T>(modelName: string): T {
    // This would create a generic repository instance
    // Implementation depends on your specific repository pattern
    throw new Error('Generic repository creation not implemented');
  }
}

/**
 * Validator Factory
 * Factory for creating different types of validators
 */
export enum ValidatorType {
  EMAIL = 'email',
  PHONE = 'phone',
  PASSWORD = 'password',
  ID = 'id',
  FILENAME = 'filename',
  URL = 'url',
}

export interface Validator {
  validate(value: any): { isValid: boolean; errors: string[] };
}

@Injectable()
export class ValidatorFactory {
  private readonly validators = new Map<ValidatorType, Validator>();

  constructor() {
    this.initializeValidators();
  }

  /**
   * Get validator by type
   */
  getValidator(type: ValidatorType): Validator {
    const validator = this.validators.get(type);
    if (!validator) {
      throw new Error(`Validator for type '${type}' not found`);
    }
    return validator;
  }

  /**
   * Validate value using specific validator
   */
  validate(
    type: ValidatorType,
    value: any,
  ): { isValid: boolean; errors: string[] } {
    const validator = this.getValidator(type);
    return validator.validate(value);
  }

  /**
   * Register custom validator
   */
  registerValidator(type: ValidatorType, validator: Validator): void {
    this.validators.set(type, validator);
  }

  private initializeValidators(): void {
    // Email validator
    this.validators.set(ValidatorType.EMAIL, {
      validate: (value: string) => {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const isValid = emailRegex.test(value);
        return {
          isValid,
          errors: isValid ? [] : ['Invalid email format'],
        };
      },
    });

    // Phone validator
    this.validators.set(ValidatorType.PHONE, {
      validate: (value: string) => {
        const phoneRegex = /^[+]?[\d\s\-()]{10,15}$/;
        const isValid = phoneRegex.test(value);
        return {
          isValid,
          errors: isValid ? [] : ['Invalid phone number format'],
        };
      },
    });

    // Password validator
    this.validators.set(ValidatorType.PASSWORD, {
      validate: (value: string) => {
        const errors: string[] = [];

        if (value.length < 8) {
          errors.push('Password must be at least 8 characters long');
        }
        if (!/[A-Z]/.test(value)) {
          errors.push('Password must contain at least one uppercase letter');
        }
        if (!/[a-z]/.test(value)) {
          errors.push('Password must contain at least one lowercase letter');
        }
        if (!/\d/.test(value)) {
          errors.push('Password must contain at least one number');
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
          errors.push('Password must contain at least one special character');
        }

        return {
          isValid: errors.length === 0,
          errors,
        };
      },
    });

    // ID validator (CUID)
    this.validators.set(ValidatorType.ID, {
      validate: (value: string) => {
        const cuidRegex = /^c[a-z0-9]{24}$/;
        const isValid = cuidRegex.test(value);
        return {
          isValid,
          errors: isValid ? [] : ['Invalid ID format'],
        };
      },
    });

    // Filename validator
    this.validators.set(ValidatorType.FILENAME, {
      validate: (value: string) => {
        const dangerousPatterns = [
          /\.\./, // Directory traversal
          /[<>:"|?*]/, // Invalid filename characters
          /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i, // Reserved Windows names
        ];

        const isValid = !dangerousPatterns.some((pattern) =>
          pattern.test(value),
        );
        return {
          isValid,
          errors: isValid ? [] : ['Invalid or dangerous filename'],
        };
      },
    });

    // URL validator
    this.validators.set(ValidatorType.URL, {
      validate: (value: string) => {
        try {
          new URL(value);
          return { isValid: true, errors: [] };
        } catch {
          return { isValid: false, errors: ['Invalid URL format'] };
        }
      },
    });
  }
}

/**
 * Response Factory
 * Factory for creating standardized API responses
 */
export interface ResponseTemplate {
  success: boolean;
  message: string;
  statusCode: number;
}

@Injectable()
export class ResponseFactory {
  private readonly templates = new Map<string, ResponseTemplate>();

  constructor() {
    this.initializeTemplates();
  }

  /**
   * Create success response
   */
  createSuccess<T>(data: T, message?: string): any {
    return {
      success: true,
      message: message || 'Operation completed successfully',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Create error response
   */
  createError(message: string, statusCode: number = 400, details?: any): any {
    return {
      success: false,
      message,
      statusCode,
      ...(details && { details }),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Create paginated response
   */
  createPaginated<T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
    message?: string,
  ): any {
    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      message: message || 'Data retrieved successfully',
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Create response from template
   */
  createFromTemplate(templateName: string, data?: any): any {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Response template '${templateName}' not found`);
    }

    return {
      ...template,
      ...(data && { data }),
      timestamp: new Date().toISOString(),
    };
  }

  private initializeTemplates(): void {
    this.templates.set('created', {
      success: true,
      message: 'Resource created successfully',
      statusCode: 201,
    });

    this.templates.set('updated', {
      success: true,
      message: 'Resource updated successfully',
      statusCode: 200,
    });

    this.templates.set('deleted', {
      success: true,
      message: 'Resource deleted successfully',
      statusCode: 200,
    });

    this.templates.set('notFound', {
      success: false,
      message: 'Resource not found',
      statusCode: 404,
    });

    this.templates.set('unauthorized', {
      success: false,
      message: 'Unauthorized access',
      statusCode: 401,
    });

    this.templates.set('forbidden', {
      success: false,
      message: 'Access forbidden',
      statusCode: 403,
    });
  }
}
