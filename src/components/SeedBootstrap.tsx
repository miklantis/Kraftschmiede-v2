import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { ensureDefinitionsSeeded } from "@/lib/seed";

// Stoesst den Erststart-Seed (Journey-Vorlagen, Skills aus V1-Code) genau einmal
// an, sobald eine Sitzung steht. Idempotent: ist schon geseedet, passiert
// nichts. Frueher haing dieser Anstoss an der Datenstand-Anzeige in den
// Einstellungen; seit die Anzeige raus ist, laeuft er hier unsichtbar im
// App-Start. Rendert nichts.
export function SeedBootstrap(): null {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const gestartet = useRef<string | null>(null);

  useEffect(() => {
    if (userId === null) return;
    if (gestartet.current === userId) return;
    gestartet.current = userId;
    void ensureDefinitionsSeeded(userId).catch((e) => {
      // Hintergrund-Anstoss: bei Fehler nicht abstuerzen, naechster Start
      // versucht es erneut (idempotent).
      console.error("Seed fehlgeschlagen:", e);
    });
  }, [userId]);

  return null;
}
