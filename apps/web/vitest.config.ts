import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["lib/**/*.test.ts", "components/**/*.test.tsx", "app/**/*.test.ts"],
    exclude: ["tests/**/*.spec.ts", "node_modules/**"]
  }
});
