import { QueryClient } from "@tanstack/react-query";

// Wie lange ein nicht mehr aktiv genutzter Eintrag im Speicher gehalten wird.
// Muss mindestens so lang sein wie die Lebensdauer des gespeicherten Caches
// (siehe offline.ts), damit Daten einen App-Neustart ohne Netz ueberstehen.
const GC_ZEIT_MS = 1000 * 60 * 60 * 24 * 7; // 7 Tage

// Wie lange frisch geladene Daten als aktuell gelten, bevor im Hintergrund
// neu geladen wird (sobald wieder Netz da ist). Je Entitaet spaeter ueberschreibbar.
const FRISCHE_MS = 1000 * 30; // 30 Sekunden

// Zentraler Query-Client fuer den gesamten Datenzugriff (TanStack Query).
// Die Datenzugriffe je Entitaet (useSessions, useExercises ...) bauen darauf auf.
// Mutationen werden bei fehlendem Netz automatisch pausiert (networkMode-Default
// "online") und nach Reconnect bzw. nach App-Neustart fortgesetzt.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: GC_ZEIT_MS,
      staleTime: FRISCHE_MS,
      retry: 1,
    },
    mutations: {
      retry: 1,
    },
  },
});
