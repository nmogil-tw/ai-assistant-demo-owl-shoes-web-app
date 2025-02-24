import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    cors: true,
    hmr: {
      host: "fe4e-2603-7000-8c00-136e-91a3-1c85-c2a3-f816.ngrok-free.app",
      protocol: "https",
      clientPort: 443
    }
  },
  plugins: [
    react(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  envDir: path.resolve(__dirname, '..'),
}));
