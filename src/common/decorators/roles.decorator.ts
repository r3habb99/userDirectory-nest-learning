import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Roles Decorator
 * Used to specify which roles are required to access a route or controller
 *
 * @param roles - Array of role strings that are allowed to access the resource
 *
 * @example
 * ```typescript
 * @Roles('ADMIN', 'SUPER_ADMIN')
 * @Get('admin-only')
 * adminOnlyEndpoint() {
 *   // Only users with ADMIN or SUPER_ADMIN role can access this
 * }
 * ```
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
