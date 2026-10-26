import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { youwareVitePlugin } from "@youware/vite-plugin-react";

// https://vite.dev/config/
export default defineConfig({
  // Relative asset paths so the built site works from any folder (e.g. GitHub Pages)
  base: "./",
  plugins: [youwareVitePlugin(), react()],
  server: {
    host: "127.0.0.1",
    port: 5173,
  },
  build: {
    // Built site goes to the repo's docs/ folder, which GitHub Pages can serve
    outDir: "../docs",
    emptyOutDir: true,
    sourcemap: false,
  },
});
