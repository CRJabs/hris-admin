import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for restricted operations like creating auth users.
// WARNING: This uses the SERVICE_ROLE_KEY. Only use this for internal admin operations.
export const supabaseAdmin = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
  ? createClient(supabaseUrl, import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
        storageKey: 'supabase.auth.admin.token'
      }
    })
  : null;