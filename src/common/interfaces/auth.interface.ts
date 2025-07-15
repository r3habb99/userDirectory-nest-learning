/**
 * Interface for login response data
 */
export interface LoginResponseData {
  admin: AdminData;
  accessToken: string;
  tokenType: string;
}

/**
 * Interface for admin data
 */
export interface AdminData {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: any;
}

/**
 * Interface for JWT payload
 */
export interface JwtPayload {
  sub: string; // admin ID
  email: string;
  role: string;
  name: string;
  iat?: number; // issued at
  exp?: number; // expiration
}

/**
 * Interface for validated admin user
 */
export interface ValidatedAdmin {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface for authenticated request
 */
export interface AuthenticatedRequest {
  user: ValidatedAdmin;
}
