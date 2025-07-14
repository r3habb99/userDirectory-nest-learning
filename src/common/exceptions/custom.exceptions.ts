import { HttpException, HttpStatus } from '@nestjs/common';

export class StudentNotFoundException extends HttpException {
  constructor(identifier?: string) {
    super(
      {
        success: false,
        message: `Student ${identifier ? `with identifier '${identifier}'` : ''} not found`,
        error: 'STUDENT_NOT_FOUND',
        statusCode: HttpStatus.NOT_FOUND,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class AdminNotFoundException extends HttpException {
  constructor(identifier?: string) {
    super(
      {
        success: false,
        message: `Admin ${identifier ? `with identifier '${identifier}'` : ''} not found`,
        error: 'ADMIN_NOT_FOUND',
        statusCode: HttpStatus.NOT_FOUND,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class CourseNotFoundException extends HttpException {
  constructor(identifier?: string) {
    super(
      {
        success: false,
        message: `Course ${identifier ? `with identifier '${identifier}'` : ''} not found`,
        error: 'COURSE_NOT_FOUND',
        statusCode: HttpStatus.NOT_FOUND,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class DuplicateEnrollmentException extends HttpException {
  constructor(enrollmentNumber: string) {
    super(
      {
        success: false,
        message: `Student with enrollment number '${enrollmentNumber}' already exists`,
        error: 'DUPLICATE_ENROLLMENT',
        statusCode: HttpStatus.CONFLICT,
      },
      HttpStatus.CONFLICT,
    );
  }
}

export class DuplicateEmailException extends HttpException {
  constructor(email: string) {
    super(
      {
        success: false,
        message: `User with email '${email}' already exists`,
        error: 'DUPLICATE_EMAIL',
        statusCode: HttpStatus.CONFLICT,
      },
      HttpStatus.CONFLICT,
    );
  }
}

export class InvalidCredentialsException extends HttpException {
  constructor() {
    super(
      {
        success: false,
        message: 'Invalid email or password',
        error: 'INVALID_CREDENTIALS',
        statusCode: HttpStatus.UNAUTHORIZED,
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class AttendanceAlreadyMarkedException extends HttpException {
  constructor(date: string) {
    super(
      {
        success: false,
        message: `Attendance for date '${date}' has already been marked`,
        error: 'ATTENDANCE_ALREADY_MARKED',
        statusCode: HttpStatus.CONFLICT,
      },
      HttpStatus.CONFLICT,
    );
  }
}

export class UnauthorizedAccessException extends HttpException {
  constructor(resource?: string) {
    super(
      {
        success: false,
        message: `Unauthorized access${resource ? ` to ${resource}` : ''}`,
        error: 'UNAUTHORIZED_ACCESS',
        statusCode: HttpStatus.FORBIDDEN,
      },
      HttpStatus.FORBIDDEN,
    );
  }
}
