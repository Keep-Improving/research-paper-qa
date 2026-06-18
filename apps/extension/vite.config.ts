import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom"
  },
  build: {
    rollupOptions: {
      input: "src/sidebar/index.html"
    }
  }
});
