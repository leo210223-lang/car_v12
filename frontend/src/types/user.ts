/**
 * FaCai-B Platform - User Types
 * File: frontend/src/types/user.ts
 */

export type UserStatus = 'active' | 'suspended' | 'pending' | 'rejected';
export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  company_name: string;
  status: UserStatus;
  suspended_at: string | null;
  suspended_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface JwtUser {
  id: string;
  email: string;
  role: UserRole;
  aud: string;
  exp: number;
  iat: number;
  sub: string;
}

export interface AuthenticatedUser extends JwtUser {
  profile?: User;
}
