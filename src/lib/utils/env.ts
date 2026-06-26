import type { APIContext } from 'astro';

/**
 * Safely retrieves environment variables in both local development (Node.js/Vite) 
 * and production (Cloudflare Pages workers context).
 */
export function getEnv(key: string, context?: APIContext | { locals: { runtime?: { env?: Record<string, any> } } }): string {
  // 1. Try to read from Cloudflare Pages runtime environment bindings if context is available
  if (context && 'locals' in context) {
    const cfEnv = (context.locals as any).runtime?.env;
    if (cfEnv && cfEnv[key]) {
      return String(cfEnv[key]);
    }
  }

  // 2. Try process.env (Node.js development server fallback)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }

  // 3. Try import.meta.env (Vite build-time/statically-replaced variable fallback)
  const metaEnv = import.meta.env;
  if (metaEnv && metaEnv[key]) {
    return String(metaEnv[key]);
  }

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
