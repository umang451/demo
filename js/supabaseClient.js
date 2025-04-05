// Initialize Supabase client

const SUPABASE_URL = 'https://tpcxutkeulrrrhvuvogu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwY3h1dGtldWxycnJodnV2b2d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4MTkzNzAsImV4cCI6MjA1OTM5NTM3MH0.5dRMc6DgtoXvq8yXSftkHkf-3QtVDu9YmklsYT0Whoo';

// Ensure the Supabase client library is loaded before this script runs
// We'll uncomment the CDN link in index.html next.
const { createClient } = supabase; // Assuming supabase is globally available from CDN

// Add CORS settings in Supabase dashboard:
// Dashboard -> Settings -> API -> CORS Origins
// Add your domain: https://yourdomain.com

// Add security headers
const SUPABASE_OPTIONS = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
};

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_OPTIONS);

console.log('Supabase client initialized.');

// Export the client for use in other modules (if using module system later)
// export { supabaseClient };
