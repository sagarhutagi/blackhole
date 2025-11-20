import { createClient } from '@supabase/supabase-js';

// User to fill these in
const SUPABASE_URL = 'https://srsgrthbfvqajobkqmlj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyc2dydGhiZnZxYWpvYmtxbWxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MDA4NDYsImV4cCI6MjA3OTE3Njg0Nn0.RiUaHdEZattvhzIAHO35vtEK-sVzCZg0HbpKKVH2MX0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
