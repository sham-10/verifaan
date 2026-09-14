// Rebuilds prisma/test.db from scratch by deleting it (if present) and
// re-applying all migrations, so every `npm test` run starts from an empty,
// up-to-date test database instead of accumulating leftover rows.
import { execSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const backendDir = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const testDbPath = path.join(backendDir, "prisma", "test.db");

if (existsSync(testDbPath)) {
  rmSync(testDbPath);
}

execSync("npx prisma migrate deploy", {
  stdio: "inherit",
  cwd: backendDir,
  env: { ...process.env, DATABASE_URL: "file:./test.db" },
});
