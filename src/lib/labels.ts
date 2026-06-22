import type { Focus } from "@/schemas/shared";

// Anzeigename des Periodisierungs-Fokus (Domaenensprache deutsch, 1:1 aus V1).
const FOCUS_LABELS: Record<Focus, string> = {
  reentry: "Wiedereinstieg",
  hypertrophy: "Hypertrophie",
  strength: "Maximalkraft",
  power: "Intensivierung",
  endurance: "Kraftausdauer",
  test: "Test/Peak",
  maintenance: "Erhaltung",
};

export function focusLabel(focus: Focus | string | null | undefined): string {
  if (!focus) return "";
  return FOCUS_LABELS[focus as Focus] ?? String(focus);
}
