import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    // Cho phép tất cả các host từ Tunnel truy cập vào code Frontend
    allowedHosts: true,
  },
});
