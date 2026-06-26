import { createClient } from '@supabase/supabase-js';
import type { APIContext } from 'astro';
import { getRequiredEnv } from '../utils/env';

/**
 * Creates and returns a Supabase client using the service role key.
 * This is instantiated per-request to ensure Cloudflare environment bindings are correctly read.
 */
export function getSupabaseClient(context?: APIContext | { locals: { runtime?: { env?: Record<string, any> } } }) {
  const supabaseUrl = getRequiredEnv('SUPABASE_URL', context);
  const supabaseServiceKey = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY', context);
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  });
}
