import { createClient } from '@supabase/supabase-js';

// Safe environment variable access that works in both standard Build environments and strict browser contexts.
// We prioritize process.env (Next.js standard) but fall back to the hardcoded keys provided.
const getEnv = (key: string) => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
};

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL') || 'https://egzzbgqoyptdkkwzttky.supabase.co';
const supabaseAnonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnenpiZ3FveXB0ZGtrd3p0dGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MzY3NjMsImV4cCI6MjA4MTAxMjc2M30.gjEo6l07GMDlgdxVoV7E1PbdgAj4IK2orI79x91JGoY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);