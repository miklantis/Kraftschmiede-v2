import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabaseConfig } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: StartPage,
});

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

function StartPage(): React.ReactElement {
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
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Kraftschmiede V2</h1>
      <p className="text-muted-foreground">Fundament steht. Aufbau laeuft.</p>
      <p className="text-muted-foreground">{status}</p>
      <Button
        variant="outline"
        onClick={() => void connection.refetch()}
        disabled={connection.isFetching}
      >
        Verbindung neu pruefen
      </Button>
    </main>
  );
}
