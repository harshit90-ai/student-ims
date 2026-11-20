import { createClient } from '@supabase/supabase-js';

// Safe environment variable retrieval across Vite (import.meta.env) and Node (process.env)
const envUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && (process.env?.SUPABASE_URL || process.env?.VITE_SUPABASE_URL)) ||
  '';

const envKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && (process.env?.SUPABASE_ANON_KEY || process.env?.VITE_SUPABASE_ANON_KEY)) ||
  '';

export const isSupabaseConfigured = Boolean(
  envUrl &&
  envKey &&
  !envUrl.includes('YOUR_SUPABASE_URL') &&
  !envKey.includes('YOUR_SUPABASE_ANON_KEY')
);

if (!isSupabaseConfigured) {
  console.warn(
    '[Supabase] Warning: SUPABASE_URL and/or SUPABASE_ANON_KEY are missing or unconfigured. Please configure them in your environment variables.'
  );
}

// Fallback dummy client if credentials are not configured, preventing fatal crash & white screen
export const supabase = createClient(
  isSupabaseConfigured ? envUrl : 'https://placeholder-project.supabase.co',
  isSupabaseConfigured ? envKey : 'placeholder-anon-key'
);
