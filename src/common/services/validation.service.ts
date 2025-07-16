import { Injectable, BadRequestException } from '@nestjs/common';
import { CourseType } from '@prisma/client';
import { EnrollmentUtils } from '../utils/enrollment.utils';
import * as validator from 'validator';
import { validate } from 'class-validator';

/**
 * Enhanced Validation Service
 * Provides comprehensive validation logic for business rules
 */
@Injectable()
export class ValidationService {
  /**
   * Validate student data comprehensively
   */
  validateStudentData(data: {
    name: string;
    email?: string;
    phone: string;
    age: number;
    admissionYear: number;
    passoutYear: number;
    courseType: CourseType;
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Name validation
    if (!this.validateName(data.name)) {
      errors.push(
        'Name must contain only letters, spaces, and common punctuation',
      );
    }

    // Email validation (if provided)
    if (data.email && !this.validateEmail(data.email)) {
      errors.push('Invalid email format');
    }

    // Phone validation
    if (!this.validatePhone(data.phone)) {
      errors.push('Invalid phone number format');
    }

    // Age validation
    if (!this.validateAge(data.age)) {
      errors.push('Age must be between 16 and 50 years');
    }

    // Academic year validation
    const yearValidation = EnrollmentUtils.validateYears(
      data.admissionYear,
      data.passoutYear,
      data.courseType,
    );
    if (!yearValidation.isValid) {
      errors.push(yearValidation.error || 'Invalid academic years');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate name format
   */
  private validateName(name: string): boolean {
    // Allow letters, spaces, apostrophes, hyphens, and dots
    const nameRegex = /^[a-zA-Z\s\-'.]+$/;
    return nameRegex.test(name.trim()) && name.trim().length >= 2;
  }

  /**
   * Enhanced email validation with additional checks
   */
  private validateEmail(email: string): boolean {
    // Use validator library for more robust email validation
    if (!validator.isEmail(email)) {
      return false;
    }

    // Additional custom checks
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const isValidFormat = emailRegex.test(email.toLowerCase());

    // Check for common disposable email domains
    const disposableDomains = [
      '10minutemail.com',
      'tempmail.org',
      'guerrillamail.com',
      'mailinator.com',
    ];

    const domain = email.split('@')[1]?.toLowerCase();
    const isDisposable = disposableDomains.includes(domain);

    return isValidFormat && !isDisposable;
  }

  /**
   * Enhanced phone validation with international support
   */
  private validatePhone(phone: string): boolean {
    // Use validator library for mobile phone validation
    if (validator.isMobilePhone(phone, 'any', { strictMode: false })) {
      return true;
    }

    // Fallback to custom validation
    const cleanPhone = phone.replace(/\D/g, '');

    // Check if it's a valid length (10-15 digits)
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      return false;
    }

    // Check for valid international format
    const phoneRegex = /^[+]?[\d\s\-()]{10,15}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Validate age range
   */
  private validateAge(age: number): boolean {
    return age >= 16 && age <= 50;
  }

  /**
   * Validate enrollment number format
   */
  validateEnrollmentNumber(enrollmentNumber: string): boolean {
    return EnrollmentUtils.isValidEnrollmentNumber(enrollmentNumber);
  }

  /**
   * Validate file upload
   */
  validateFileUpload(
    file: Express.Multer.File,
    options: {
      maxSize?: number;
      allowedTypes?: string[];
      maxWidth?: number;
      maxHeight?: number;
    } = {},
  ): { isValid: boolean; error?: string } {
    const {
      maxSize = 5 * 1024 * 1024, // 5MB default
      allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
      maxWidth = 2048,
      maxHeight = 2048,
    } = options;

    // Check file size
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `File size exceeds maximum allowed size of ${Math.round(maxSize / 1024 / 1024)}MB`,
      };
    }

    // Check file type
    if (!allowedTypes.includes(file.mimetype)) {
      return {
        isValid: false,
        error: `File type ${file.mimetype} is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      };
    }

    // Additional validation can be added here for image dimensions
    // This would require image processing library

    return { isValid: true };
  }

  /**
   * Sanitize input string
   */
  sanitizeString(input: string): string {
    if (!input) return '';

    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  /**
   * Enhanced password strength validation with scoring
   */
  validatePassword(password: string): { isValid: boolean; errors: string[]; score: number } {
    const errors: string[] = [];
    let score = 0;

    // Length checks
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    } else if (password.length >= 8) {
      score += 1;
    }

    if (password.length >= 12) {
      score += 1;
    }

    // Character type checks
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    } else {
      score += 1;
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    } else {
      score += 1;
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    } else {
      score += 1;
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    } else {
      score += 1;
    }

    // Advanced checks
    if (password.length >= 16) {
      score += 1;
    }

    // Check for repeated characters
    if (/(.)\1{2,}/.test(password)) {
      errors.push('Password should not contain repeated characters');
      score -= 1;
    }

    // Check for sequential characters
    if (this.hasSequentialChars(password)) {
      errors.push('Password should not contain sequential characters');
      score -= 1;
    }

    // Check for common weak passwords
    const commonPasswords = [
      'password', '123456', 'qwerty', 'admin', 'letmein', 'welcome',
      'monkey', '1234567890', 'password123', 'admin123'
    ];
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common and easily guessable');
      score = 0;
    }

    // Check for dictionary words (simplified)
    if (this.containsDictionaryWord(password)) {
      errors.push('Password should not contain common dictionary words');
      score -= 1;
    }

    return {
      isValid: errors.length === 0 && score >= 4,
      errors,
      score: Math.max(0, Math.min(10, score)),
    };
  }

  private hasSequentialChars(password: string): boolean {
    const sequences = [
      'abcdefghijklmnopqrstuvwxyz',
      '0123456789',
      'qwertyuiop',
      'asdfghjkl',
      'zxcvbnm'
    ];

    for (const seq of sequences) {
      for (let i = 0; i <= seq.length - 3; i++) {
        const subseq = seq.substring(i, i + 3);
        if (password.toLowerCase().includes(subseq) ||
            password.toLowerCase().includes(subseq.split('').reverse().join(''))) {
          return true;
        }
      }
    }

    return false;
  }

  private containsDictionaryWord(password: string): boolean {
    const commonWords = [
      'password', 'admin', 'user', 'login', 'welcome', 'hello',
      'world', 'computer', 'internet', 'email', 'phone', 'name'
    ];

    const lowerPassword = password.toLowerCase();
    return commonWords.some(word => lowerPassword.includes(word));
  }

  /**
   * Validate date range
   */
  validateDateRange(startDate: Date, endDate: Date): boolean {
    return startDate <= endDate;
  }

  /**
   * Validate pagination parameters
   */
  validatePagination(
    page: number,
    limit: number,
  ): { page: number; limit: number } {
    const validatedPage = Math.max(1, Math.floor(page) || 1);
    const validatedLimit = Math.min(100, Math.max(1, Math.floor(limit) || 10));

    return { page: validatedPage, limit: validatedLimit };
  }

  /**
   * Validate sort parameters
   */
  validateSortParams(sortBy: string, allowedFields: string[]): string {
    return allowedFields.includes(sortBy) ? sortBy : allowedFields[0];
  }

  /**
   * Validate UUID format
   */
  validateUUID(uuid: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Validate and sanitize input data
   */
  async validateAndSanitizeDto<T extends object>(
    dto: T,
    dtoClass: new () => T,
  ): Promise<{ isValid: boolean; errors: string[]; sanitizedData?: T }> {
    try {
      const instance = Object.assign(new dtoClass(), dto);
      const validationErrors = await validate(instance);

      if (validationErrors.length > 0) {
        const errors = validationErrors.flatMap((error) =>
          Object.values(error.constraints || {}),
        );
        return { isValid: false, errors };
      }

      return { isValid: true, errors: [], sanitizedData: instance };
    } catch (error) {
      return {
        isValid: false,
        errors: ['Validation failed due to unexpected error'],
      };
    }
  }

  /**
   * Validate business rules for student enrollment
   */
  validateEnrollmentBusinessRules(data: {
    admissionYear: number;
    passoutYear: number;
    courseType: CourseType;
    age: number;
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check if admission year is not in the future beyond next year
    const currentYear = new Date().getFullYear();
    if (data.admissionYear > currentYear + 1) {
      errors.push('Admission year cannot be more than one year in the future');
    }

    // Check if passout year is reasonable based on course duration
    const courseDurations: Record<CourseType, number> = {
      BCA: 3,
      MCA: 2,
      BBA: 3,
      MBA: 2,
      BCOM: 3,
      MCOM: 2,
    };

    const expectedPassoutYear = data.admissionYear + courseDurations[data.courseType];
    if (data.passoutYear !== expectedPassoutYear) {
      errors.push(
        `Passout year should be ${expectedPassoutYear} for ${data.courseType} course starting in ${data.admissionYear}`,
      );
    }

    // Age validation for course type
    if (data.courseType.startsWith('M') && data.age < 20) {
      errors.push('Students must be at least 20 years old for Master\'s programs');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate file security
   */
  validateFileSecurity(file: Express.Multer.File): { isValid: boolean; error?: string } {
    // Check for potentially dangerous file extensions
    const dangerousExtensions = [
      '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js',
      '.jar', '.php', '.asp', '.aspx', '.jsp', '.sh', '.ps1'
    ];

    const fileExtension = file.originalname.toLowerCase().split('.').pop();
    if (fileExtension && dangerousExtensions.includes(`.${fileExtension}`)) {
      return {
        isValid: false,
        error: 'File type is not allowed for security reasons',
      };
    }

    // Check for null bytes in filename (security vulnerability)
    if (file.originalname.includes('\0')) {
      return {
        isValid: false,
        error: 'Invalid filename detected',
      };
    }

    // Check filename length
    if (file.originalname.length > 255) {
      return {
        isValid: false,
        error: 'Filename is too long',
      };
    }

    return { isValid: true };
  }



  /**
   * Validate ID format (CUID)
   */
  validateId(id: string): boolean {
    // CUID format validation
    const cuidRegex = /^c[a-z0-9]{24}$/;
    return cuidRegex.test(id);
  }
}
