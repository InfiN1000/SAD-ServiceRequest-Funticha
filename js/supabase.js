// Supabase client configuration
const SUPABASE_URL = "https://hxpodosrcnfwbecegyok.supabase.co";
const SUPABASE_KEY = "sb_publishable_k7MpGOeqIlOz11sP80j6Ag_K5ke1KQi";

// Create and expose Supabase client globally
window.supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);