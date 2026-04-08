import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://iwbnersnkpqkvwyhnldz.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3Ym5lcnNua3Bxa3Z3eWhubGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NzY5MjEsImV4cCI6MjA5MTI1MjkyMX0.EAKftTggq5W1uPJDYG78SRhcJBziegPxkPLsJ39perA';

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
