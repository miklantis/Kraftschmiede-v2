import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactElement, ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

// Ergebnis eines Anmelde-/Registriervorgangs. Bei Erfolg signalisiert
// needsConfirmation, dass noch eine E-Mail-Bestaetigung aussteht (dann gibt es
// noch keine Sitzung). Bei Misserfolg eine bereits uebersetzte Meldung.
export type AuthResult =
  | { ok: true; needsConfirmation?: boolean }
  | { ok: false; message: string };

interface AuthContextValue {
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Bekannte Supabase-Fehlertexte ins Deutsche uebersetzen; Unbekanntes bleibt
// im Original, damit nichts verschluckt wird.
function uebersetzeFehler(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) {
    return "E-Mail oder Passwort ist falsch.";
  }
  if (m.includes("already registered") || m.includes("already been registered")) {
    return "Mit dieser E-Mail gibt es bereits ein Konto.";
  }
  if (m.includes("password should be at least")) {
    return "Das Passwort muss mindestens 6 Zeichen haben.";
  }
  if (m.includes("unable to validate email") || m.includes("invalid email")) {
    return "Die E-Mail-Adresse ist ungültig.";
  }
  if (m.includes("email not confirmed")) {
    return "Die E-Mail ist noch nicht bestätigt.";
  }
  return message;
}

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      loading,
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) return { ok: false, message: uebersetzeFehler(error.message) };
        return { ok: true };
      },
      signUp: async (email, password) => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) return { ok: false, message: uebersetzeFehler(error.message) };
        return { ok: true, needsConfirmation: data.session === null };
      },
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [session, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error("useAuth muss innerhalb von AuthProvider verwendet werden.");
  }
  return ctx;
}
