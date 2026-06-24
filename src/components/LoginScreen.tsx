import { useState } from "react";
import type { FormEvent, ReactElement } from "react";

import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandMark } from "@/components/shell/BrandMark";

// Reiner Anmelde-Screen im V1-"Klar"-Look: Marken-Lockup (gruenes Kaestchen mit
// BrandMark plus versaler Schriftzug wie in der Sidebar) ueber einer weissen
// Karte auf der grauen Canvas. Kein Registrieren-Pfad: die App nutzt ein
// bestehendes Konto, daher kein "Konto anlegen".
export function LoginScreen(): ReactElement {
  const { signIn } = useAuth();
  const [email, setEmail] = useState<string>("");
  const [passwort, setPasswort] = useState<string>("");
  const [fehler, setFehler] = useState<string | null>(null);
  const [busy, setBusy] = useState<boolean>(false);

  async function absenden(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setFehler(null);
    if (email.trim() === "" || passwort === "") {
      setFehler("Bitte E-Mail und Passwort eingeben.");
      return;
    }
    setBusy(true);
    const ergebnis = await signIn(email.trim(), passwort);
    setBusy(false);
    if (!ergebnis.ok) {
      setFehler(ergebnis.message);
      return;
    }
    // Bei Erfolg mit bestehender Sitzung schaltet der AuthGate automatisch um.
  }

  return (
    <main className="bg-background flex min-h-dvh flex-col items-center justify-center p-6">
      <div className="bg-card rounded-card w-full max-w-sm p-7 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_12px_32px_-16px_rgba(20,24,40,0.18)] sm:p-8">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <span className="bg-primary text-primary-foreground rounded-control flex size-11 items-center justify-center">
            <BrandMark size={26} />
          </span>
          <span className="text-[15px] font-bold tracking-[1px] text-[#5c5c61] uppercase">
            Kraftschmiede
          </span>
          <p className="text-muted-foreground text-sm">
            Melde dich an, um fortzufahren.
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
              autoComplete="current-password"
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

          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Bitte warten ..." : "Anmelden"}
          </Button>
        </form>
      </div>
    </main>
  );
}
