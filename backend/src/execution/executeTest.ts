import type { PrismaClient } from "@prisma/client";

// Playwright error messages include ANSI color codes (for terminal
// display) in their "Call log" section; strip them before persisting so
// the log renders as plain text in the UI.
function stripAnsi(value: string): string {
  // eslint-disable-next-line no-control-regex
  return value.replace(/\x1b\[[0-9;]*m/g, "");
}

// Orchestrates one execution run: creates the Execution row (status
// "running"), invokes the injected runner, then records the final
// status ("pass" or "fail") and log. Decoupled from Playwright/runSteps so
// it can be unit-tested with a fake runner; the caller wires up the real
// browser-driven runner.
export async function executeTest<T>(
  prisma: PrismaClient,
  testId: string,
  steps: T[],
  run: (steps: T[]) => Promise<void>,
  onExecutionCreated?: (executionId: string) => void,
): Promise<{ executionId: string }> {
  const execution = await prisma.execution.create({
    data: { testId, status: "running" },
  });

  onExecutionCreated?.(execution.id);

  try {
    await run(steps);

    await prisma.execution.update({
      where: { id: execution.id },
      data: { status: "pass", finishedAt: new Date() },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    await prisma.execution.update({
      where: { id: execution.id },
      data: { status: "fail", finishedAt: new Date(), log: stripAnsi(message) },
    });
  }

  return { executionId: execution.id };
}
