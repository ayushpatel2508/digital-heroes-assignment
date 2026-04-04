import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl: string | undefined = process.env.SUPABASE_URL;
const supabaseKey: string | undefined = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('❌ SUPABASE_URL or SUPABASE_SERVICE_KEY is missing from environment variables.');
}

// Use Service Role Key for backend administration (bypasses RLS)
const supabase: SupabaseClient = createClient(supabaseUrl || '', supabaseKey || '');

export default supabase;
