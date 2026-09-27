import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '../config/supabaseConfig';

const cleanUrl = typeof SUPABASE_URL === 'string' ? SUPABASE_URL.trim() : '';
const cleanKey = typeof SUPABASE_PUBLISHABLE_KEY === 'string' ? SUPABASE_PUBLISHABLE_KEY.trim() : '';

export const isSupabaseConfigured = Boolean(
  cleanUrl &&
  cleanKey &&
  cleanKey !== 'REPLACE_WITH_SUPABASE_PUBLISHABLE_KEY' &&
  cleanUrl !== 'undefined' &&
  cleanKey !== 'undefined' &&
  !cleanUrl.includes('your-supabase') &&
  !cleanKey.includes('your-supabase') &&
  (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://'))
);

let cachedClient: SupabaseClient;

try {
  cachedClient = createClient(
    isSupabaseConfigured ? cleanUrl : 'https://placeholder.supabase.co',
    isSupabaseConfigured ? cleanKey : 'placeholder-anon-key',
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  );
} catch (e) {
  console.error('Failed to initialize Supabase client:', e);
  cachedClient = createClient('https://placeholder.supabase.co', 'placeholder-anon-key', {
    auth: { persistSession: false },
  });
}

export const supabase = cachedClient;
