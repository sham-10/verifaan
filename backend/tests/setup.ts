import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

// Point every test file's PrismaClient at the dedicated test database instead
// of the .env file's dev.db, before any test file imports src/app.ts.
dotenv.config({
  path: fileURLToPath(new URL("../.env.test", import.meta.url)),
  override: true,
});
