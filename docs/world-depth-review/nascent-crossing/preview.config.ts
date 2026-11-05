import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
export default defineConfig({
  plugins: [vue()],
  server: { host: "127.0.0.1", port: 5188, strictPort: true, hmr: false },
  optimizeDeps: {
    entries: ["docs/world-depth-review/nascent-crossing/preview.html"],
  },
});
