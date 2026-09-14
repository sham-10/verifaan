// Seeds prisma/dev.db with one real Project and one real Test (the DemoPay
// login scenario), so the frontend has an id it can actually GET /tests/:id
// against instead of the Phase 1 hardcoded fixture id, which doesn't exist
// in the database. Idempotent: safe to re-run, it reuses the existing
// project/test instead of duplicating them, refreshing the seeded test's
// steps in place.
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const backendDir = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const devDatabaseUrl = "file:./dev.db";

execSync("npx prisma migrate deploy", {
  stdio: "inherit",
  cwd: backendDir,
  env: { ...process.env, DATABASE_URL: devDatabaseUrl },
});

const prisma = new PrismaClient({
  datasources: { db: { url: devDatabaseUrl } },
});

const PROJECT_NAME = "DemoPay";
const TEST_ID = "test-demo-pay-login";
const TEST_NAME = "DemoPay login";

// Selectors confirmed against the real page (no ids present; the page is
// identified by name attributes and text instead).
const STEPS = [
  { order: 1, action: "navigate", targetType: "url", targetValue: "https://heshamben.com/paydemo/login.php" },
  { order: 2, action: "input", targetType: "locator", targetValue: "[name='email']", value: "admin@demopay.test" },
  { order: 3, action: "input", targetType: "locator", targetValue: "[name='password']", value: "Admin123!" },
  { order: 4, action: "click", targetType: "locator", targetValue: "button:has-text('Login')" },
  { order: 5, action: "verify", targetType: "locator", targetValue: "h1:has-text('Welcome')" },
];

async function main() {
  let project = await prisma.project.findFirst({ where: { name: PROJECT_NAME } });
  if (!project) {
    project = await prisma.project.create({
      data: {
        name: PROJECT_NAME,
        description: "Sample project seeded for local development",
      },
    });
  }

  const existingTest = await prisma.test.findUnique({ where: { id: TEST_ID } });

  if (existingTest) {
    await prisma.$transaction(async (tx) => {
      await tx.step.deleteMany({ where: { testId: TEST_ID } });
      await tx.test.update({
        where: { id: TEST_ID },
        data: { name: TEST_NAME, steps: { create: STEPS } },
      });
    });
    console.log(`Already seeded, steps updated. Test id: ${TEST_ID}`);
    return;
  }

  const test = await prisma.test.create({
    data: {
      id: TEST_ID,
      name: TEST_NAME,
      projectId: project.id,
      steps: { create: STEPS },
    },
  });

  console.log(`Seeded test id: ${test.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
