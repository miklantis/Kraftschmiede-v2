import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { fileURLToPath, URL } from "node:url";

// base ist auf den Repo-Namen gesetzt, weil die App unter
// https://miklantis.github.io/Kraftschmiede-v2/ ausgeliefert wird (Projekt-Pages).
export default defineConfig({
  base: "/Kraftschmiede-v2/",
  // Reihenfolge wichtig: Router-Plugin vor dem React-Plugin.
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
