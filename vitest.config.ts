import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "src"),
    },
  },
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["src/lib/documents/visibility.ts", "src/db/index.ts"],
      reporter: ["text"],
    },
  },
});
