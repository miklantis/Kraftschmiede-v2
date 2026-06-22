import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import "./index.css";

// Zentraler Query-Client fuer den Datenzugriff (TanStack Query).
const queryClient = new QueryClient();

// Router aus dem generierten Routenbaum. basepath folgt dem Vite-base,
// damit Routing lokal (/) und auf GitHub Pages (/Kraftschmiede-v2/) gleich funktioniert.
const router = createRouter({
  routeTree,
  basepath: import.meta.env.BASE_URL,
  defaultPreload: "intent",
});

// Typsicherheit fuer den Router (Links, Params) projektweit.
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("root");
if (rootElement === null) {
  throw new Error("Root-Element #root nicht gefunden.");
}

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
