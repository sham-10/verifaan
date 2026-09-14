import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./tests/setup.ts"],
    // All test files share one SQLite file; running them in parallel causes
    // "database is locked" timeouts, so force them to run one at a time.
    fileParallelism: false,
  },
});
