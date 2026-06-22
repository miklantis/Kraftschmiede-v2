import type { ReactElement, ReactNode } from "react";

import { useAuth } from "@/lib/auth";
import { LoginScreen } from "@/components/LoginScreen";

// Tor vor der App: erst Sitzungsstatus klaeren, dann entweder Login zeigen
// oder die eigentliche App durchlassen. Schreibzugriffe brauchen eine
// angemeldete Sitzung (RLS), daher sitzt das Tor vor dem Router.
export function AuthGate({ children }: { children: ReactNode }): ReactElement {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <main className="text-muted-foreground flex min-h-dvh items-center justify-center p-6">
        Laden ...
      </main>
    );
  }

  if (session === null) {
    return <LoginScreen />;
  }

  return <>{children}</>;
}
