import { Link } from "@tanstack/react-router";
import { NAV_ENTRIES } from "@/lib/nav";

// Untere Navigationsleiste fuer Mobile (unter 960px). Sichtbarkeit steuert die
// AppShell. Nur Icons (kein Label); das Label dient als aria-label/Titel fuer
// Bedienhilfen. Einstellungen sitzt separat im Kopf (Konto-Symbol).
export function BottomNav(): React.ReactElement {
  return (
    <nav
      className="bg-card/95 border-border fixed inset-x-0 bottom-0 z-30 flex border-t backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {NAV_ENTRIES.map((entry) => {
        const Icon = entry.icon;
        return (
          <Link
            key={entry.to}
            to={entry.to}
            activeOptions={entry.exact ? { exact: true } : undefined}
            aria-label={entry.label}
            title={entry.label}
            className="text-muted-foreground flex flex-1 items-center justify-center py-3.5 transition-colors"
            activeProps={{ className: "text-primary" }}
          >
            <Icon className="size-6 shrink-0" />
          </Link>
        );
      })}
    </nav>
  );
}
