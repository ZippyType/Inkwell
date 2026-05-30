import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "⚠️ Supabase credentials are missing! Please define VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY " +
    "in the AI Studio Secrets panel in the dev workspace configuration."
  );
}

// Create a single supabase client instance for use across our components
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-project-id.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);
