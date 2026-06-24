import type { ReactElement, ReactNode } from "react";

import { useAuth } from "@/lib/auth";
import { LoginScreen } from "@/components/LoginScreen";
import { InviteScreen } from "@/components/InviteScreen";

// Tor vor der App: erst Sitzungsstatus klaeren, dann den passenden Screen
// zeigen. Reihenfolge ist wichtig:
//  1. Laden -> Platzhalter.
//  2. Einladungs-Modus -> "Passwort festlegen" (auch wenn schon eine Sitzung
//     besteht, denn der Eingeladene hat noch kein eigenes Passwort vergeben).
//  3. Keine Sitzung -> Login.
//  4. Angemeldet -> App.
// Schreibzugriffe brauchen eine angemeldete Sitzung (RLS), daher sitzt das Tor
// vor dem Router.
export function AuthGate({ children }: { children: ReactNode }): ReactElement {
  const { session, loading, invitePending } = useAuth();

  if (loading) {
    return (
      <main className="text-muted-foreground flex min-h-dvh items-center justify-center p-6">
        Laden ...
      </main>
    );
  }

  if (invitePending) {
    return <InviteScreen />;
  }

  if (session === null) {
    return <LoginScreen />;
  }

  return <>{children}</>;
}
