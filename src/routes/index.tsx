import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabaseConfig } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Datenstand } from "@/components/Datenstand";
import { V1Import } from "@/components/V1Import";
import { ThemeToggle } from "@/components/ThemeToggle";

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
  const { session, signOut } = useAuth();
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

      <ThemeToggle />

      {/* Vorlaeufige Schau der Markenfarben zum Sichtpruefen (entfaellt mit der
          echten Navigation/Einstellungen in spaeteren Phasen). */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="bg-primary/12 text-primary rounded-full px-3 py-1 font-mono text-sm">
          +2,5 kg
        </span>
        <span className="bg-intensity/15 text-intensity-foreground rounded-full px-3 py-1 text-sm">
          Intensitaet
        </span>
        <span className="bg-skill/15 text-skill-foreground rounded-full px-3 py-1 text-sm">
          Skill
        </span>
        <span className="bg-yoga/15 text-yoga-foreground rounded-full px-3 py-1 text-sm">
          Yoga
        </span>
        <span className="bg-warning/15 text-warning-foreground rounded-full px-3 py-1 text-sm">
          Warnung
        </span>
        <span className="bg-danger/15 text-danger rounded-full px-3 py-1 text-sm">
          Gefahr
        </span>
      </div>

      <Button
        variant="outline"
        onClick={() => void connection.refetch()}
        disabled={connection.isFetching}
      >
        Verbindung neu pruefen
      </Button>

      <div className="text-muted-foreground mt-2 flex flex-col items-center gap-2 text-sm">
        <span>Angemeldet als {session?.user.email ?? "unbekannt"}</span>
        <Button variant="ghost" size="sm" onClick={() => void signOut()}>
          Abmelden
        </Button>
      </div>

      <Datenstand />
      <V1Import />
    </main>
  );
}
