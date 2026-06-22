import { useEffect, useRef, useState } from "react";
import type { ReactElement } from "react";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { ensureDefinitionsSeeded } from "@/lib/seed";
import { Button } from "@/components/ui/button";

// Alle Tabellen mit verstaendlichem Label. Reihenfolge nach Themenbloecken.
const TABELLEN: ReadonlyArray<{ table: string; label: string }> = [
  { table: "inventory_bars", label: "Stangen" },
  { table: "inventory_plates", label: "Scheiben" },
  { table: "inventory_kettlebells", label: "Kettlebells" },
  { table: "inventory_equipment", label: "Equipment" },
  { table: "exercises", label: "Übungen" },
  { table: "exercise_muscles", label: "Muskel-Zuordnungen" },
  { table: "templates", label: "Workout-Vorlagen" },
  { table: "template_exercises", label: "Vorlagen-Übungen" },
  { table: "journey_templates", label: "Journey-Vorlagen" },
  { table: "journey_template_phases", label: "Vorlagen-Phasen" },
  { table: "skills", label: "Skills" },
  { table: "skill_phases", label: "Skill-Phasen" },
  { table: "skill_phase_exercises", label: "Skill-Übungen" },
  { table: "skill_phase_equipment", label: "Skill-Equipment" },
  { table: "journeys", label: "Journeys" },
  { table: "phases", label: "Journey-Phasen" },
  { table: "sessions", label: "Einheiten" },
  { table: "session_exercises", label: "Einheit-Übungen" },
  { table: "sets", label: "Sätze" },
  { table: "skill_progress", label: "Skill-Fortschritt" },
  { table: "body_log", label: "Body-Log" },
  { table: "composition", label: "Messungen" },
  { table: "settings", label: "Einstellungen" },
];

export function Datenstand(): ReactElement {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const [counts, setCounts] = useState<Record<string, number> | null>(null);
  const [busy, setBusy] = useState<boolean>(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [seedInfo, setSeedInfo] = useState<string | null>(null);
  const gestartet = useRef<boolean>(false);

  async function ladeCounts(): Promise<void> {
    const ergebnisse = await Promise.all(
      TABELLEN.map(async ({ table }) => {
        const { count, error } = await supabase
          .from(table)
          .select("*", { count: "exact", head: true });
        if (error) throw new Error(`${table}: ${error.message}`);
        return [table, count ?? 0] as const;
      }),
    );
    const next: Record<string, number> = {};
    for (const [table, c] of ergebnisse) next[table] = c;
    setCounts(next);
  }

  async function initialisieren(): Promise<void> {
    if (userId === null) return;
    setBusy(true);
    setFehler(null);
    try {
      const ergebnis = await ensureDefinitionsSeeded(userId);
      setSeedInfo(
        ergebnis.seeded
          ? "Definitionen wurden angelegt."
          : "Definitionen sind bereits vorhanden.",
      );
      await ladeCounts();
    } catch (e) {
      setFehler(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function aktualisieren(): Promise<void> {
    setBusy(true);
    setFehler(null);
    try {
      await ladeCounts();
    } catch (e) {
      setFehler(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (gestartet.current) return;
    gestartet.current = true;
    void initialisieren();
  }, []);

  return (
    <section className="w-full max-w-md space-y-3 text-left">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Datenstand</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void aktualisieren()}
          disabled={busy}
        >
          {busy ? "..." : "Aktualisieren"}
        </Button>
      </div>

      {seedInfo !== null ? (
        <p className="text-muted-foreground text-xs">{seedInfo}</p>
      ) : null}
      {fehler !== null ? (
        <p className="text-destructive text-xs" role="alert">
          {fehler}
        </p>
      ) : null}

      <ul className="divide-border divide-y rounded-md border text-sm">
        {TABELLEN.map(({ table, label }) => (
          <li
            key={table}
            className="flex items-center justify-between px-3 py-1.5"
          >
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium tabular-nums">
              {counts === null ? "–" : counts[table]}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
