// Pure-static SPA build for GitHub Pages.
// Bypasses the TanStack Start/Nitro SSR pipeline used in dev/preview.
//
//   BASE_PATH=/repo-name/ bun run build:static
//
// Outputs an SPA bundle to ./dist that can be served from any static host.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

export default defineConfig({
  base: process.env.BASE_PATH || "/",
  plugins: [
    tsconfigPaths(),
    tailwindcss(),
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
