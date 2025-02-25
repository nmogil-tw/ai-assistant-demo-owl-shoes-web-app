import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    cors: true,
    hmr: process.env.NGROK_URL ? {
      host: process.env.NGROK_URL,
      protocol: "https",
      clientPort: 443
    } : true,
    allowedHosts: ['.ngrok-free.app', '.ngrok.io']
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
