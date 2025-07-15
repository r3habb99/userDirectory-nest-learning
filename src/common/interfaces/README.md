# Common Interfaces

This directory contains all the TypeScript interfaces used throughout the application. Interfaces are organized by domain/functionality.

## Files

### `api-response.interface.ts`
Contains interfaces for API responses:
- `ApiResponse<T>` - Standard API response structure
- `PaginatedResponse<T>` - Paginated response structure
- `AuthResponse` - (Deprecated) Legacy auth response structure

### `auth.interface.ts`
Contains authentication-related interfaces:
- `LoginResponseData` - Response data for login operations
- `AdminData` - Admin user data structure
- `JwtPayload` - JWT token payload structure
- `ValidatedAdmin` - Validated admin user structure
- `AuthenticatedRequest` - Authenticated request structure

### `enrollment.interface.ts`
Contains enrollment and student-related interfaces:
- `EnrollmentNumberConfig` - Configuration for enrollment number generation
- `StudentFilters` - Filters for student queries
- `AttendanceFilters` - Filters for attendance queries
- `PaginationOptions` - Pagination configuration
- `EnrollmentStats` - Enrollment statistics structure

### `index.ts`
Barrel export file that re-exports all interfaces from this directory.

## Usage

Import interfaces from the barrel export:
```typescript
import { ApiResponse, LoginResponseData, StudentFilters } from '../../common/interfaces';
```

Or import from specific files:
```typescript
import { LoginResponseData } from '../../common/interfaces/auth.interface';
```

## Migration Notes

Interfaces have been moved from various service and controller files to this centralized location for better organization and reusability. The following files were updated:
- `src/services/auth/auth.service.spec.ts`
- `src/controllers/auth/auth.controller.ts`
- `src/common/strategies/jwt.strategy.ts`
- `src/services/enrollment/enrollment.service.ts`
- `src/common/types/enrollment.types.ts`
