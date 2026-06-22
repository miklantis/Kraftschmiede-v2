import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserId } from "./useUserId";

// Schluessel der aktiven Equipment-Eintraege. Dienen als "vorhandenes Geraet"
// fuer das Skill-Equipment-Tor (skillAdvice vergleicht gegen diese Liste).
export function useOwnedEquipmentKeys() {
  const userId = useUserId();
  return useQuery({
    queryKey: ["ownedEquipment", userId],
    enabled: userId !== null,
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("inventory_equipment")
        .select("key, active")
        .eq("active", true);
      if (error) throw new Error(error.message);
      return ((data ?? []) as Array<{ key: string }>).map((e) => e.key);
    },
  });
}
