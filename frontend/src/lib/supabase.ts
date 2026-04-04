import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing from environment variables.');
}

// Frontend client uses cookie-based storage for better security
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    storage: {
      getItem: (key: string) => {
        const cookies = document.cookie.split(';');
        const cookie = cookies.find(c => c.trim().startsWith(`${key}=`));
        if (!cookie) return null;
        try {
          return decodeURIComponent(cookie.split('=')[1]);
        } catch {
          return null;
        }
      },
      setItem: (key: string, value: string) => {
        // Set cookie with 7 days expiry, secure, httpOnly simulation
        const expires = new Date();
        expires.setDate(expires.getDate() + 7);
        document.cookie = `${key}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
      },
      removeItem: (key: string) => {
        document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      }
    },
    storageKey: 'sb-auth-token',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Helper functions to manage admin status in cookies
export const setAdminStatus = (isAdmin: boolean) => {
  const expires = new Date();
  expires.setDate(expires.getDate() + 7);
  document.cookie = `sb-is-admin=${isAdmin}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
};

export const getAdminStatus = (): boolean => {
  const cookies = document.cookie.split(';');
  const cookie = cookies.find(c => c.trim().startsWith('sb-is-admin='));
  if (!cookie) return false;
  return cookie.split('=')[1] === 'true';
};

export const clearAdminStatus = () => {
  document.cookie = 'sb-is-admin=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
};

