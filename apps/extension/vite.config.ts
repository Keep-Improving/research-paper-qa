import react from "@vitejs/plugin-react";
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";

function chromeManifestPlugin(): Plugin {
  return {
    name: "chrome-manifest",
    writeBundle() {
      const outputPath = resolve("dist/manifest.json");
      mkdirSync(dirname(outputPath), { recursive: true });
      copyFileSync(resolve("src/manifest.json"), outputPath);
    }
  };
}

export default defineConfig({
  plugins: [react(), chromeManifestPlugin()],
  test: {
    environment: "jsdom"
  },
  build: {
    rollupOptions: {
      input: {
        sidebar: "src/sidebar/index.html",
        content: "src/content/index.ts",
        background: "src/background/index.ts"
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === "content") {
            return "assets/content.js";
          }

          if (chunkInfo.name === "background") {
            return "assets/background.js";
          }

          return "assets/[name]-[hash].js";
        }
      }
    }
  }
});
