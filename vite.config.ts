import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // Proxy auth requests to the backend during development to avoid CORS issues
    proxy: {
      // proxy auth (and other API gateway paths) to the API gateway during development
      '/auth': {
        target: 'http://localhost:4004',
        changeOrigin: true,
        secure: false,
      },
      // you can also proxy other routes if you prefer: '/students', '/hostels', '/requests' -> gateway
      '/students': {
        target: 'http://localhost:4004',
        changeOrigin: true,
        secure: false,
      },
      '/hostels': {
        target: 'http://localhost:4004',
        changeOrigin: true,
        secure: false,
      },
      '/requests': {
        target: 'http://localhost:4004',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
