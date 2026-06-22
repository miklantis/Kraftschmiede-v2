import { useQuery } from "@tanstack/react-query";
import { supabaseConfig } from "./lib/supabase.ts";

// Echter Verbindungstest: ruft den Health-Endpoint des Supabase-Projekts auf.
// Erfolg beweist, dass URL und Key stimmen und die App den Server erreicht.
async function checkConnection(): Promise<boolean> {
  const response = await fetch(`${supabaseConfig.url}/auth/v1/health`, {
    headers: { apikey: supabaseConfig.publishableKey },
  });
  if (!response.ok) {
    throw new Error(`Health-Check fehlgeschlagen (Status ${response.status}).`);
  }
  return true;
}

export function App(): React.ReactElement {
  const connection = useQuery({
    queryKey: ["verbindung"],
    queryFn: checkConnection,
    retry: 1,
  });

  let status: string;
  if (connection.isPending) {
    status = "Pruefe Verbindung zur Datenbank ...";
  } else if (connection.isSuccess) {
    status = "Verbindung zur Datenbank steht.";
  } else {
    status = "Verbindung zur Datenbank fehlgeschlagen.";
  }

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.5rem",
        fontFamily: "system-ui, sans-serif",
        textAlign: "center",
        padding: "1.5rem",
      }}
    >
      <h1 style={{ margin: 0, fontSize: "1.5rem" }}>Kraftschmiede V2</h1>
      <p style={{ margin: 0, opacity: 0.7 }}>Fundament steht. Aufbau laeuft.</p>
      <p style={{ margin: 0, opacity: 0.7 }}>{status}</p>
    </main>
  );
}
