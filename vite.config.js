import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ command }) => ({
  // GitHub Pages serves this app from a subpath; CI sets VITE_BASE_PATH.
  // Other builds (e.g. the S3/CloudFront root deploy in deploy.sh) stay at "/".
  base: command === "build" ? process.env.VITE_BASE_PATH || "/" : "/",
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
    hmr: {
      port: 3000,
    },
  },
}));
