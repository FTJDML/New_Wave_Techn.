import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * True once a real Supabase project's URL and anon key are supplied via env vars (see
 * .env.example). Never true in this session — no Supabase project has been provisioned yet — so
 * every consumer of `supabase` must handle the `null` case rather than assume it's always ready.
 */
export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured ? createClient(url as string, anonKey as string) : null;
