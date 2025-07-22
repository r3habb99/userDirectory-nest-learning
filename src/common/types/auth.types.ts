// Re-export UserRole from Prisma client
export { UserRole } from '@prisma/client';

// Re-export auth interfaces
export {
  LoginResponseData,
  AdminData,
  JwtPayload,
  ValidatedAdmin,
} from '../interfaces/auth.interface';

// Import ValidatedAdmin for type definitions
import { ValidatedAdmin } from '../interfaces/auth.interface';
import { Request } from 'express';

// Additional auth-related types
export type AuthenticatedRequest = Request & {
  user: ValidatedAdmin;
};

export type RoleType = 'ADMIN' | 'STUDENT' | 'SUPER_ADMIN' | 'STAFF';

export interface AuthContext {
  user: ValidatedAdmin;
  permissions: string[];
  isAuthenticated: boolean;
}
