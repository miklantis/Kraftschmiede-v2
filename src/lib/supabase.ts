import { createClient } from "@supabase/supabase-js";

// Oeffentliche Konfiguration aus den VITE_-Env-Variablen (.env).
// Der publishable key ist fuer den Client gedacht; RLS schuetzt die Daten.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (typeof supabaseUrl !== "string" || supabaseUrl.length === 0) {
  throw new Error("VITE_SUPABASE_URL fehlt. Bitte in der .env setzen.");
}

if (
  typeof supabasePublishableKey !== "string" ||
  supabasePublishableKey.length === 0
) {
  throw new Error(
    "VITE_SUPABASE_PUBLISHABLE_KEY fehlt. Bitte in der .env setzen.",
  );
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey);

// Wird fuer die Verbindungspruefung gebraucht (Health-Endpoint).
export const supabaseConfig = {
  url: supabaseUrl,
  publishableKey: supabasePublishableKey,
} as const;
