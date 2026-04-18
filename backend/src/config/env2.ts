/**
 * FaCai-B Platform - Environment Configuration
 * File: backend/src/config/env.ts
 */

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface EnvironmentVariables {
  PORT: number;
  NODE_ENV: 'development' | 'staging' | 'production';
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  REDIS_URL: string | null;
  CORS_ORIGINS: string[];
  RATE_LIMIT_MAX: number;
  MAX_FILE_SIZE: number;
  ALLOWED_MIME_TYPES: string[];
}

const REQUIRED_ENV_VARS = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const;

function validateRequiredEnvVars(): void {
  const missing: string[] = [];
  
  for (const varName of REQUIRED_ENV_VARS) {
    if (!process.env[varName] || process.env[varName]?.trim() === '') {
      missing.push(varName);
    }
  }
  
  if (missing.length > 0) {
    throw new Error(
      `[ENV] Missing required environment variables:\n` +
      missing.map(v => `  - ${v}`).join('\n') +
      `\n\nPlease check your .env file or environment configuration.`
    );
  }
}

function parseInteger(value: string | undefined, defaultValue: number): number {
  if (value === undefined || value === '') return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

function parseArray(value: string | undefined, defaultValue: string[]): string[] {
  if (value === undefined || value.trim() === '') return defaultValue;
  return value.split(',').map(s => s.trim()).filter(s => s !== '');
}

function parseNodeEnv(value: string | undefined): EnvironmentVariables['NODE_ENV'] {
  const validEnvs: EnvironmentVariables['NODE_ENV'][] = ['development', 'staging', 'production'];
  const normalized = (value || 'development').toLowerCase() as EnvironmentVariables['NODE_ENV'];
  return validEnvs.includes(normalized) ? normalized : 'development';
}

validateRequiredEnvVars();

export const env: EnvironmentVariables = {
  PORT: parseInteger(process.env['PORT'], 3000),
  NODE_ENV: parseNodeEnv(process.env['NODE_ENV']),
  SUPABASE_URL: process.env['SUPABASE_URL']!,
  SUPABASE_ANON_KEY: process.env['SUPABASE_ANON_KEY']!,
  SUPABASE_SERVICE_ROLE_KEY: process.env['SUPABASE_SERVICE_ROLE_KEY']!,
  REDIS_URL: process.env['REDIS_URL'] || null,
  CORS_ORIGINS: parseArray(
    process.env['CORS_ORIGINS'],
    ['http://localhost:3000', 'http://localhost:5173']
  ),
  RATE_LIMIT_MAX: parseInteger(process.env['RATE_LIMIT_MAX'], 100),
  MAX_FILE_SIZE: parseInteger(process.env['MAX_FILE_SIZE'], 5 * 1024 * 1024),
  ALLOWED_MIME_TYPES: parseArray(
    process.env['ALLOWED_MIME_TYPES'],
    ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
  ),
};

export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isStaging = env.NODE_ENV === 'staging';

export default env;
