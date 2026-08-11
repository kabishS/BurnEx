/* =========================================================================
   BURN-EX — supabase.js
   -------------------------------------------------------------------------
   Live Supabase config. js/app.js's `DB` object talks to these tables —
   run data/schema.sql once in your Supabase project's SQL editor before
   using the app (Dashboard → SQL Editor → New query → paste the file →
   Run). Every page loads the Supabase JS CDN script before this file,
   and this file before js/app.js.
   ========================================================================= */

const SUPABASE_URL = 'https://kradhlsccutzjlturklz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_R_6iumDRXLeX8ormBwQn7Q_oabVpeAC';

let supabaseClient = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase) {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
  console.error('Burn-Ex: Supabase client failed to initialize — check that the CDN script loaded before supabase.js.');
}
