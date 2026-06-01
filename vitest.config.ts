import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "edge-runtime",
    environmentMatchGlobs: [["src/**/*.test.{jsx,tsx}", "jsdom"]],
    server: { deps: { inline: ["convex-test"] } },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
