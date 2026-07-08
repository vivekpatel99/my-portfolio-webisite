import path from "node:path";
import react from "@vitejs/plugin-react";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "edge-runtime",
    environmentMatchGlobs: [["src/**/*.test.{jsx,tsx}", "jsdom"]],
    setupFiles: ["./src/test/setup.js"],
    exclude: [...configDefaults.exclude, "playwright-output/**", "tests/qa/**"],
    server: { deps: { inline: ["convex-test"] } },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@convex": path.resolve(__dirname, "./convex/_generated"),
    },
  },
});
