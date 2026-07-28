import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | undefined;

export function getSupabaseAdmin(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Server Supabase configuration is missing. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel.',
    );
  }

  cachedClient = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  return cachedClient;
}
