import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { ValidatedAdmin } from '../interfaces/auth.interface';

/**
 * Roles Guard
 * Implements role-based access control for protected routes
 */
@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: ValidatedAdmin = request.user;

    if (!user) {
      this.logger.warn('No user found in request context');
      throw new ForbiddenException('Access denied: No user context');
    }

    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      this.logger.warn(
        `Access denied for user ${user.email} with role ${user.role}. Required roles: ${requiredRoles.join(', ')}`,
      );
      throw new ForbiddenException(
        `Access denied: Insufficient permissions. Required roles: ${requiredRoles.join(' or ')}`,
      );
    }

    this.logger.debug(
      `Access granted for user ${user.email} with role ${user.role}`,
    );

    return true;
  }
}
