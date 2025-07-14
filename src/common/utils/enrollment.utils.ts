import { CourseType } from '../types/enrollment.types';

export class EnrollmentUtils {
  /**
   * Generate enrollment number in format: YYYY[COURSE][SEQUENCE]
   * Example: 2025BCA001, 2025MCA150
   */
  static generateEnrollmentNumber(
    year: number,
    course: CourseType,
    sequence: number,
  ): string {
    const paddedSequence = sequence.toString().padStart(3, '0');
    return `${year}${course}${paddedSequence}`;
  }

  /**
   * Parse enrollment number to extract components
   */
  static parseEnrollmentNumber(enrollmentNumber: string): {
    year: number;
    course: CourseType;
    sequence: number;
  } | null {
    // Pattern: YYYY[COURSE][SEQUENCE]
    const pattern = /^(\d{4})(BCA|MCA|BBA|MBA|BCOM|MCOM)(\d{3})$/;
    const match = enrollmentNumber.match(pattern);

    if (!match) {
      return null;
    }

    return {
      year: parseInt(match[1], 10),
      course: match[2] as CourseType,
      sequence: parseInt(match[3], 10),
    };
  }

  /**
   * Validate enrollment number format
   */
  static isValidEnrollmentNumber(enrollmentNumber: string): boolean {
    return this.parseEnrollmentNumber(enrollmentNumber) !== null;
  }

  /**
   * Get next sequence number for a course and year
   */
  static getNextSequenceNumber(lastNumber: number): number {
    return lastNumber + 1;
  }

  /**
   * Check if enrollment number is within valid range (001-300)
   */
  static isSequenceInValidRange(sequence: number): boolean {
    return sequence >= 1 && sequence <= 300;
  }

  /**
   * Get course duration in years
   */
  static getCourseDuration(course: CourseType): number {
    const durations: Record<CourseType, number> = {
      BCA: 3,
      MCA: 2,
      BBA: 3,
      MBA: 2,
      BCOM: 3,
      MCOM: 2,
    };
    return durations[course];
  }

  /**
   * Calculate expected passout year based on admission year and course
   */
  static calculatePassoutYear(admissionYear: number, course: CourseType): number {
    return admissionYear + this.getCourseDuration(course);
  }

  /**
   * Validate admission and passout years
   */
  static validateYears(admissionYear: number, passoutYear: number, course: CourseType): {
    isValid: boolean;
    error?: string;
  } {
    const currentYear = new Date().getFullYear();
    const expectedPassoutYear = this.calculatePassoutYear(admissionYear, course);

    if (admissionYear > currentYear + 1) {
      return {
        isValid: false,
        error: 'Admission year cannot be more than one year in the future',
      };
    }

    if (admissionYear < currentYear - 10) {
      return {
        isValid: false,
        error: 'Admission year cannot be more than 10 years in the past',
      };
    }

    if (passoutYear !== expectedPassoutYear) {
      return {
        isValid: false,
        error: `Passout year should be ${expectedPassoutYear} for ${course} course starting in ${admissionYear}`,
      };
    }

    return { isValid: true };
  }
}
