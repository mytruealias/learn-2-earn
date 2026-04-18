import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    exclude: ["e2e/**", "node_modules/**"],
    globals: false,
    environment: "node",
    setupFiles: ["tests/setup-env.ts"],
    globalSetup: "tests/global-setup.ts",
    testTimeout: 30000,
    hookTimeout: 60000,
    pool: "forks",
    fileParallelism: false,
  },
});
