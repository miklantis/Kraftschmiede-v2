import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "./App.tsx";

const rootElement = document.getElementById("root");
if (rootElement === null) {
  throw new Error("Root-Element #root nicht gefunden.");
}

// Zentraler Query-Client fuer den Datenzugriff (TanStack Query).
const queryClient = new QueryClient();

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
