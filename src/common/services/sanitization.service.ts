import { Injectable } from '@nestjs/common';
import * as validator from 'validator';

/**
 * Input Sanitization Service
 * Provides comprehensive input sanitization to prevent security vulnerabilities
 */
@Injectable()
export class SanitizationService {
  /**
   * Sanitize string input to prevent XSS attacks
   */
  sanitizeString(input: string): string {
    if (!input || typeof input !== 'string') return '';

    return validator.escape(input.trim());
  }

  /**
   * Sanitize HTML content (for rich text fields)
   */
  sanitizeHtml(input: string, allowedTags: string[] = []): string {
    if (!input || typeof input !== 'string') return '';

    // Basic HTML sanitization - remove script tags and dangerous attributes
    let sanitized = input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/style\s*=/gi, '');

    // If no tags are allowed, strip all HTML
    if (allowedTags.length === 0) {
      sanitized = sanitized.replace(/<[^>]*>/g, '');
    } else {
      // Remove tags not in allowed list
      const allowedTagsRegex = new RegExp(
        `<(?!\/?(?:${allowedTags.join('|')})\s*\/?>)[^>]+>`,
        'gi'
      );
      sanitized = sanitized.replace(allowedTagsRegex, '');
    }

    return sanitized.trim();
  }

  /**
   * Sanitize filename to prevent directory traversal and other attacks
   */
  sanitizeFilename(filename: string): string {
    if (!filename || typeof filename !== 'string') return '';

    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special chars with underscore
      .replace(/\.{2,}/g, '.') // Replace multiple dots with single dot
      .replace(/^\.+|\.+$/g, '') // Remove leading/trailing dots
      .substring(0, 255); // Limit length
  }

  /**
   * Sanitize email address
   */
  sanitizeEmail(email: string): string {
    if (!email || typeof email !== 'string') return '';

    const sanitized = validator.normalizeEmail(email.trim().toLowerCase());
    return sanitized || '';
  }

  /**
   * Sanitize phone number
   */
  sanitizePhone(phone: string): string {
    if (!phone || typeof phone !== 'string') return '';

    // Keep only digits, plus sign, spaces, hyphens, and parentheses
    return phone.replace(/[^\d+\s\-()]/g, '').trim();
  }

  /**
   * Sanitize URL
   */
  sanitizeUrl(url: string): string {
    if (!url || typeof url !== 'string') return '';

    const trimmed = url.trim();
    
    // Check if it's a valid URL
    if (!validator.isURL(trimmed, { 
      protocols: ['http', 'https'],
      require_protocol: true 
    })) {
      return '';
    }

    return trimmed;
  }

  /**
   * Sanitize numeric input
   */
  sanitizeNumber(input: any): number | null {
    if (input === null || input === undefined || input === '') return null;

    const num = Number(input);
    return isNaN(num) ? null : num;
  }

  /**
   * Sanitize boolean input
   */
  sanitizeBoolean(input: any): boolean | null {
    if (input === null || input === undefined) return null;

    if (typeof input === 'boolean') return input;
    if (typeof input === 'string') {
      const lower = input.toLowerCase().trim();
      if (lower === 'true' || lower === '1' || lower === 'yes') return true;
      if (lower === 'false' || lower === '0' || lower === 'no') return false;
    }
    if (typeof input === 'number') {
      return input !== 0;
    }

    return null;
  }

  /**
   * Sanitize date input
   */
  sanitizeDate(input: any): Date | null {
    if (!input) return null;

    const date = new Date(input);
    return isNaN(date.getTime()) ? null : date;
  }

  /**
   * Sanitize array input
   */
  sanitizeArray<T>(
    input: any,
    sanitizer: (item: any) => T | null
  ): T[] {
    if (!Array.isArray(input)) return [];

    return input
      .map(sanitizer)
      .filter((item): item is T => item !== null);
  }

  /**
   * Sanitize object by applying sanitizers to each property
   */
  sanitizeObject<T extends Record<string, any>>(
    input: any,
    sanitizers: Partial<Record<keyof T, (value: any) => any>>
  ): Partial<T> {
    if (!input || typeof input !== 'object') return {};

    const sanitized: Partial<T> = {};

    for (const [key, sanitizer] of Object.entries(sanitizers)) {
      if (key in input && typeof sanitizer === 'function') {
        const sanitizedValue = sanitizer(input[key]);
        if (sanitizedValue !== null && sanitizedValue !== undefined) {
          (sanitized as any)[key] = sanitizedValue;
        }
      }
    }

    return sanitized;
  }

  /**
   * Remove SQL injection patterns
   */
  sanitizeSqlInput(input: string): string {
    if (!input || typeof input !== 'string') return '';

    return input
      .replace(/['";\\]/g, '') // Remove quotes and backslashes
      .replace(/\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b/gi, '') // Remove SQL keywords
      .trim();
  }

  /**
   * Sanitize search query
   */
  sanitizeSearchQuery(query: string): string {
    if (!query || typeof query !== 'string') return '';

    return query
      .replace(/[<>]/g, '') // Remove HTML brackets
      .replace(/['"]/g, '') // Remove quotes
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .substring(0, 100); // Limit length
  }

  /**
   * Sanitize sort field name
   */
  sanitizeSortField(field: string, allowedFields: string[]): string {
    if (!field || typeof field !== 'string') return allowedFields[0] || 'id';

    const sanitized = field.replace(/[^a-zA-Z0-9_]/g, '');
    return allowedFields.includes(sanitized) ? sanitized : allowedFields[0] || 'id';
  }

  /**
   * Sanitize pagination parameters
   */
  sanitizePagination(page: any, limit: any): { page: number; limit: number } {
    const sanitizedPage = Math.max(1, Math.floor(this.sanitizeNumber(page) || 1));
    const sanitizedLimit = Math.min(100, Math.max(1, Math.floor(this.sanitizeNumber(limit) || 10)));

    return { page: sanitizedPage, limit: sanitizedLimit };
  }

  /**
   * Deep sanitize an object recursively
   */
  deepSanitize(obj: any): any {
    if (obj === null || obj === undefined) return obj;

    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }

    if (typeof obj === 'number' || typeof obj === 'boolean') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.deepSanitize(item));
    }

    if (typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const sanitizedKey = this.sanitizeString(key);
        sanitized[sanitizedKey] = this.deepSanitize(value);
      }
      return sanitized;
    }

    return obj;
  }

  /**
   * Validate and sanitize ID parameter
   */
  sanitizeId(id: string): string {
    if (!id || typeof id !== 'string') return '';

    // CUID format validation and sanitization
    const sanitized = id.replace(/[^a-z0-9]/g, '');
    const cuidRegex = /^c[a-z0-9]{24}$/;
    
    return cuidRegex.test(sanitized) ? sanitized : '';
  }

  /**
   * Sanitize enum value
   */
  sanitizeEnum<T extends string>(
    value: any,
    allowedValues: readonly T[]
  ): T | null {
    if (!value || typeof value !== 'string') return null;

    const sanitized = value.trim().toUpperCase() as T;
    return allowedValues.includes(sanitized) ? sanitized : null;
  }
}
