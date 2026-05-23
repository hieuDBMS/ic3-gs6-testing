import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // Avoid parsing URL on every page load (saves time, no OAuth redirects in this app)
    detectSessionInUrl: false,
  },
  // Limit realtime event rate if ever used (default is 10/s)
  realtime: {
    params: { eventsPerSecond: 2 },
  },
});
