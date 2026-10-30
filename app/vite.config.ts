import path from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  root: import.meta.dirname,
  base: "/",
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  build: { outDir: path.resolve(import.meta.dirname, "dist"), emptyOutDir: true },
  server: { port: Number(process.env.PORT) || 5173 }
});
