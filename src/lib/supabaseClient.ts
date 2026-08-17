import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Null until the env vars are set. Every call site checks for this instead
 * of assuming it exists — the app has to keep working on localStorage alone
 * for anyone running it without a Supabase project wired up.
 */
export const supabase = url && anonKey ? createClient(url, anonKey) : null
