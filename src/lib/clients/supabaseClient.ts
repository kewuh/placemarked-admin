import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Use import.meta.env for Vite/SvelteKit environment variables
const url = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY;

class DBAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DBAuthError';
  }
}

if (!url || !key) throw new DBAuthError('Missing credentials');

export const supabase = createClient<Database>(url ?? '', key ?? '');
