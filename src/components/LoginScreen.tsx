import { useState } from "react";
import type { FormEvent, ReactElement } from "react";

import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Modus = "anmelden" | "registrieren";

export function LoginScreen(): ReactElement {
  const { signIn, signUp } = useAuth();
  const [modus, setModus] = useState<Modus>("anmelden");
  const [email, setEmail] = useState<string>("");
  const [passwort, setPasswort] = useState<string>("");
  const [fehler, setFehler] = useState<string | null>(null);
  const [hinweis, setHinweis] = useState<string | null>(null);
  const [busy, setBusy] = useState<boolean>(false);

  async function absenden(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setFehler(null);
    setHinweis(null);
    if (email.trim() === "" || passwort === "") {
      setFehler("Bitte E-Mail und Passwort eingeben.");
      return;
    }
    setBusy(true);
    const ergebnis =
      modus === "anmelden"
        ? await signIn(email.trim(), passwort)
        : await signUp(email.trim(), passwort);
    setBusy(false);
    if (!ergebnis.ok) {
      setFehler(ergebnis.message);
      return;
    }
    // Bei Erfolg mit bestehender Sitzung schaltet der AuthGate automatisch um.
    // Steht noch eine Bestaetigung aus, zurueck auf Anmelden mit Hinweis.
    if (modus === "registrieren" && ergebnis.needsConfirmation === true) {
      setHinweis(
        "Konto angelegt. Bitte bestätige die E-Mail und melde dich dann an.",
      );
      setPasswort("");
      setModus("anmelden");
    }
  }

  function wechsleModus(): void {
    setModus(modus === "anmelden" ? "registrieren" : "anmelden");
    setFehler(null);
    setHinweis(null);
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Kraftschmiede</h1>
          <p className="text-muted-foreground text-sm">
            {modus === "anmelden"
              ? "Melde dich an, um fortzufahren."
              : "Lege dein Konto an."}
          </p>
        </div>

        <form className="space-y-4" onSubmit={(e) => void absenden(e)}>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              E-Mail
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="passwort" className="text-sm font-medium">
              Passwort
            </label>
            <Input
              id="passwort"
              type="password"
              autoComplete={
                modus === "anmelden" ? "current-password" : "new-password"
              }
              value={passwort}
              onChange={(e) => setPasswort(e.target.value)}
              disabled={busy}
            />
          </div>

          {fehler !== null ? (
            <p className="text-destructive text-sm" role="alert">
              {fehler}
            </p>
          ) : null}
          {hinweis !== null ? (
            <p className="text-muted-foreground text-sm" role="status">
              {hinweis}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={busy}>
            {busy
              ? "Bitte warten ..."
              : modus === "anmelden"
                ? "Anmelden"
                : "Konto anlegen"}
          </Button>
        </form>

        <p className="text-muted-foreground text-center text-sm">
          {modus === "anmelden" ? "Noch kein Konto? " : "Schon ein Konto? "}
          <button
            type="button"
            className="text-primary underline-offset-4 hover:underline"
            onClick={wechsleModus}
          >
            {modus === "anmelden" ? "Konto anlegen" : "Anmelden"}
          </button>
        </p>
      </div>
    </main>
  );
}
