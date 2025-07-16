import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../services/prisma/prisma.service';

/**
 * Custom validation decorators for enhanced validation
 */

// Validator for checking if a record exists in database
@ValidatorConstraint({ name: 'RecordExists', async: true })
@Injectable()
export class RecordExistsConstraint implements ValidatorConstraintInterface {
  constructor(private readonly prisma: PrismaService) {}

  async validate(value: any, args: ValidationArguments): Promise<boolean> {
    if (!value) return false;

    const [model, field = 'id'] = args.constraints;

    try {
      const record = await (this.prisma as any)[model].findUnique({
        where: { [field]: value },
      });
      return !!record;
    } catch (error) {
      return false;
    }
  }

  defaultMessage(args: ValidationArguments): string {
    const [model] = args.constraints;
    return `${model} with this ${args.property} does not exist`;
  }
}

// Validator for checking if a record is unique
@ValidatorConstraint({ name: 'IsUnique', async: true })
@Injectable()
export class IsUniqueConstraint implements ValidatorConstraintInterface {
  constructor(private readonly prisma: PrismaService) {}

  async validate(value: any, args: ValidationArguments): Promise<boolean> {
    if (!value) return true; // Allow empty values, use @IsNotEmpty for required fields

    const [model, field = args.property] = args.constraints;

    try {
      const record = await (this.prisma as any)[model].findUnique({
        where: { [field]: value },
      });
      return !record;
    } catch (error) {
      return false;
    }
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} already exists`;
  }
}

// Validator for academic year validation
@ValidatorConstraint({ name: 'ValidAcademicYear', async: false })
export class ValidAcademicYearConstraint
  implements ValidatorConstraintInterface
{
  validate(value: any): boolean {
    if (!value || typeof value !== 'number') return false;

    const currentYear = new Date().getFullYear();
    const minYear = 2020;
    const maxYear = currentYear + 10;

    return value >= minYear && value <= maxYear;
  }

  defaultMessage(): string {
    const currentYear = new Date().getFullYear();
    return `Academic year must be between 2020 and ${currentYear + 10}`;
  }
}

// Validator for strong password
@ValidatorConstraint({ name: 'IsStrongPassword', async: false })
export class IsStrongPasswordConstraint
  implements ValidatorConstraintInterface
{
  validate(value: any): boolean {
    if (!value || typeof value !== 'string') return false;

    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongPasswordRegex.test(value);
  }

  defaultMessage(): string {
    return 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character';
  }
}

// Validator for enrollment number format
@ValidatorConstraint({ name: 'ValidEnrollmentNumber', async: false })
export class ValidEnrollmentNumberConstraint
  implements ValidatorConstraintInterface
{
  validate(value: any): boolean {
    if (!value || typeof value !== 'string') return false;

    // Format: YYYYCCC### (e.g., 2024BCA001)
    const enrollmentRegex = /^\d{4}(BCA|MCA|BBA|MBA|BCOM|MCOM)\d{3}$/;
    return enrollmentRegex.test(value);
  }

  defaultMessage(): string {
    return 'Enrollment number must follow the format YYYYCCC### (e.g., 2024BCA001)';
  }
}

// Decorator functions
export function RecordExists(
  model: string,
  field?: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [model, field],
      validator: RecordExistsConstraint,
    });
  };
}

export function IsUnique(
  model: string,
  field?: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [model, field],
      validator: IsUniqueConstraint,
    });
  };
}

export function ValidAcademicYear(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: ValidAcademicYearConstraint,
    });
  };
}

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: IsStrongPasswordConstraint,
    });
  };
}

export function ValidEnrollmentNumber(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: ValidEnrollmentNumberConstraint,
    });
  };
}

// Validator for safe filename
@ValidatorConstraint({ name: 'SafeFilename', async: false })
export class SafeFilenameConstraint implements ValidatorConstraintInterface {
  validate(value: any): boolean {
    if (!value || typeof value !== 'string') return false;

    // Check for dangerous characters and patterns
    const dangerousPatterns = [
      /\.\./, // Directory traversal
      /[<>:"|?*]/, // Invalid filename characters
      /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i, // Reserved Windows names
      /^\./, // Hidden files starting with dot
    ];

    return !dangerousPatterns.some((pattern) => pattern.test(value));
  }

  defaultMessage(): string {
    return 'Filename contains invalid or potentially dangerous characters';
  }
}

export function SafeFilename(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: SafeFilenameConstraint,
    });
  };
}

// Validator for CUID format
@ValidatorConstraint({ name: 'IsCUID', async: false })
export class IsCUIDConstraint implements ValidatorConstraintInterface {
  validate(value: any): boolean {
    if (!value || typeof value !== 'string') return false;

    // CUID format: c + 24 lowercase alphanumeric characters
    const cuidRegex = /^c[a-z0-9]{24}$/;
    return cuidRegex.test(value);
  }

  defaultMessage(): string {
    return 'Invalid ID format';
  }
}

export function IsCUID(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: IsCUIDConstraint,
    });
  };
}
