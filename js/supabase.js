// Supabase client configuration
const SUPABASE_URL = "https://db.hxpodosrcnfwbecegyok.supabase.co";
const SUPABASE_KEY = "sb_publishable_k7MpGOeqIlOz11sP80j6Ag_K5ke1KQi";
// create client using the global `supabase` UMD object and expose as `supabaseClient`
const supabaseClient = (typeof supabase !== 'undefined')
	? supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
	: null;
window.supabaseClient = supabaseClient;
