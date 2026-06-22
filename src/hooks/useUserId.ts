import { useAuth } from "@/lib/auth";

// Aktuelle Nutzer-Id (oder null, wenn nicht angemeldet). Dient den Daten-Hooks
// als Teil des Query-Keys und als Schalter (enabled), bis eine Sitzung steht.
export function useUserId(): string | null {
  const { session } = useAuth();
  return session?.user.id ?? null;
}
