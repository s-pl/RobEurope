import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client singleton.
 *
 * Requires env vars (set in Vercel dashboard + .env.local for dev):
 *   VITE_SUPABASE_URL       — Project URL from Supabase dashboard
 *   VITE_SUPABASE_ANON_KEY  — anon/public key (safe to expose in browser)
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set — Realtime features will be unavailable.');
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
