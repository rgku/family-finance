import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables not configured - running in demo mode');
    return createBrowserClient(
      'https://iwbnersnkpqkvwyhnldz.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3Ym5lcnNua3Bxa3Z3eWhubGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NzY5MjEsImV4cCI6MjA5MTI1MjkyMX0.EAKftTggq5W1uPJDYG78SRhcJBziegPxkPLsJ39perA'
    );
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
