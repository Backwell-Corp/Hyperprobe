import type { APIContext } from 'astro';

/**
 * Safely retrieves environment variables in both local development (Node.js/Vite) 
 * and production (Cloudflare Pages workers context).
 */
export function getEnv(key: string, context?: APIContext | { locals: { runtime?: { env?: Record<string, any> } } }): string {
  const getRawEnv = (k: string): string => {
    if (context && 'locals' in context) {
      const cfEnv = (context.locals as any).runtime?.env;
      if (cfEnv && cfEnv[k]) {
        return String(cfEnv[k]);
      }
    }
    if (typeof process !== 'undefined' && process.env && process.env[k]) {
      return process.env[k] as string;
    }
    const metaEnv = import.meta.env;
    if (metaEnv && metaEnv[k]) {
      return String(metaEnv[k]);
    }
    return '';
  };

  const primaryValue = getRawEnv(key);
  if (primaryValue) return primaryValue;

  const publicValue = getRawEnv(`PUBLIC_${key}`);
  if (publicValue) return publicValue;

  const nextPublicValue = getRawEnv(`NEXT_PUBLIC_${key}`);
  if (nextPublicValue) return nextPublicValue;

  return '';
}

/**
 * Check if a required env variable is missing and throw a descriptive error.
 */
export function getRequiredEnv(key: string, context?: APIContext | { locals: { runtime?: { env?: Record<string, any> } } }): string {
  const value = getEnv(key, context);
  if (!value) {
    throw new Error(`Configuration Error: Environment variable '${key}' is missing.`);
  }
  return value;
}
