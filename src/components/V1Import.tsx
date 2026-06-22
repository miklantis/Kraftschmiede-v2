import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, ReactElement } from "react";

import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  analysiereV1,
  bereitsImportiert,
  importiereV1,
  type ImportVorschau,
  type ImportErgebnis,
} from "@/lib/v1import";

// Temporaerer Import-Knopf fuer die komplette V1-Datenbasis. Liest die in V1
// exportierte JSON-Datei, zeigt eine Vorschau (was gefunden wurde) und schreibt
// erst nach Bestaetigung. Gesperrt, sobald schon Uebungen/Einheiten vorhanden sind,
// damit nichts versehentlich doppelt importiert wird. Wandert spaeter nach
// Einstellungen (Import/Export, Phase 10/12).
export function V1Import(): ReactElement {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;

  const [gesperrt, setGesperrt] = useState<boolean | null>(null);
  const [vorschau, setVorschau] = useState<ImportVorschau | null>(null);
  const [ergebnis, setErgebnis] = useState<ImportErgebnis | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [busy, setBusy] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let aktiv = true;
    void (async () => {
      try {
        const b = await bereitsImportiert();
        if (aktiv) setGesperrt(b);
      } catch (e) {
        if (aktiv) setFehler(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      aktiv = false;
    };
  }, []);

  function dateiGewaehlt(ev: ChangeEvent<HTMLInputElement>): void {
    setFehler(null);
    setErgebnis(null);
    setVorschau(null);
    const datei = ev.target.files?.[0];
    if (datei === undefined) return;
    const leser = new FileReader();
    leser.onload = () => {
      try {
        const text = typeof leser.result === "string" ? leser.result : "";
        setVorschau(analysiereV1(text));
      } catch (e) {
        setFehler(e instanceof Error ? e.message : String(e));
      }
    };
    leser.onerror = () => {
      setFehler("Datei konnte nicht gelesen werden.");
    };
    leser.readAsText(datei);
  }

  async function importieren(): Promise<void> {
    if (userId === null || vorschau === null) return;
    setBusy(true);
    setFehler(null);
    try {
      const r = await importiereV1(userId, vorschau.blob);
      setErgebnis(r);
      setVorschau(null);
      setGesperrt(true);
      if (inputRef.current !== null) inputRef.current.value = "";
    } catch (e) {
      setFehler(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  function zuruecksetzen(): void {
    setVorschau(null);
    setFehler(null);
    if (inputRef.current !== null) inputRef.current.value = "";
  }

  return (
    <section className="w-full max-w-md space-y-3 text-left">
      <h2 className="text-sm font-semibold">V1-Daten importieren</h2>

      {gesperrt === true && ergebnis === null ? (
        <p className="text-muted-foreground text-xs">
          Es sind bereits Daten vorhanden. Der Import ist gesperrt, damit nichts
          doppelt angelegt wird.
        </p>
      ) : null}

      {gesperrt === false ? (
        <>
          <p className="text-muted-foreground text-xs">
            In der alten Kraftschmiede exportieren, die JSON-Datei hier wählen,
            Vorschau prüfen und dann importieren.
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="application/json,.json"
            onChange={dateiGewaehlt}
            disabled={busy}
            className="text-muted-foreground file:bg-secondary file:text-secondary-foreground file:mr-3 file:rounded-md file:border-0 file:px-3 file:py-1.5 file:text-sm block w-full text-xs"
          />
        </>
      ) : null}

      {fehler !== null ? (
        <p className="text-destructive text-xs" role="alert">
          {fehler}
        </p>
      ) : null}

      {vorschau !== null ? (
        <div className="space-y-3">
          <ul className="divide-border divide-y rounded-md border text-sm">
            {vorschau.zeilen.map(({ label, anzahl }) => (
              <li
                key={label}
                className="flex items-center justify-between px-3 py-1.5"
              >
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium tabular-nums">{anzahl}</span>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <Button onClick={() => void importieren()} disabled={busy}>
              {busy ? "Importiere ..." : "Importieren"}
            </Button>
            <Button variant="ghost" onClick={zuruecksetzen} disabled={busy}>
              Abbrechen
            </Button>
          </div>
        </div>
      ) : null}

      {ergebnis !== null ? (
        <div className="space-y-2">
          <p className="text-xs font-medium">Import abgeschlossen.</p>
          <ul className="divide-border divide-y rounded-md border text-sm">
            {ergebnis.eingefuegt.map(({ label, anzahl }) => (
              <li
                key={label}
                className="flex items-center justify-between px-3 py-1.5"
              >
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium tabular-nums">{anzahl}</span>
              </li>
            ))}
          </ul>
          {ergebnis.uebersprungen.length > 0 ? (
            <div className="text-muted-foreground text-xs">
              <p>Übersprungen:</p>
              <ul className="list-inside list-disc">
                {ergebnis.uebersprungen.map((u) => (
                  <li key={u}>{u}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
