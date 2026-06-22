import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

// Grundrahmen aller Seiten. Hier sitzt spaeter die Navigation (Phase 2).
// Aktuell nur ein Platzhalter-Rahmen plus das Outlet fuer die jeweilige Seite.
export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout(): React.ReactElement {
  return (
    <>
      <Outlet />
      {import.meta.env.DEV ? (
        <TanStackRouterDevtools position="bottom-right" />
      ) : null}
    </>
  );
}
