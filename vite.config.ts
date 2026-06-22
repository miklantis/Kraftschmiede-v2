import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base ist auf den Repo-Namen gesetzt, weil die App unter
// https://miklantis.github.io/Kraftschmiede-v2/ ausgeliefert wird (Projekt-Pages).
export default defineConfig({
  base: "/Kraftschmiede-v2/",
  plugins: [react()],
});
