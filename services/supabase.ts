
import { createClient } from '@supabase/supabase-js';

// -----------------------------------------------------------
// 🔴 ACTION REQUIRED: PASTE YOUR SUPABASE KEYS HERE
// -----------------------------------------------------------

const SUPABASE_URL = 'https://rrklrkbbvrmsztzgewhq.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJya2xya2JidnJtc3p0emdld2hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NjQ2NzUsImV4cCI6MjA4MzQ0MDY3NX0.YpfNHSrUeMfkc_bVJZVpWUoT8KQxLsbXLPp6GMyGLW4'; 

// -----------------------------------------------------------

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper to check if connection is configured
export const isSupabaseConfigured = () => {
  return SUPABASE_URL.includes('YOUR_PROJECT_ID') === false;
};
