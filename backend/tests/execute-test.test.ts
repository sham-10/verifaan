import { describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { executeTest } from "../src/execution/executeTest.js";

const prisma = new PrismaClient();

// A step, per ADR-004: id, action (navigate | input | click | verify),
// target: { type, value }, and an optional value (used by input).
interface Step {
  id: string;
  action: string;
  target: { type: string; value: string };
  value?: string;
}

async function createTest() {
  const project = await prisma.project.create({
    data: { name: "Checkout flow", description: "Tests for checkout" },
  });

  return prisma.test.create({
    data: { name: "Add item to cart", projectId: project.id },
  });
}

const steps: Step[] = [
  {
    id: "step-1",
    action: "navigate",
    target: { type: "url", value: "https://demopay.test/login" },
  },
];

describe("executeTest", () => {
  it("creates an Execution record with status running before the runner settles", async () => {
    const test = await createTest();
    let resolveRun!: () => void;
    const pendingRun = new Promise<void>((resolve) => {
      resolveRun = resolve;
    });
    const runner = vi.fn().mockReturnValue(pendingRun);

    const resultPromise = executeTest(prisma, test.id, steps, runner);

    // Give executeTest a tick to create the Execution row before the runner resolves.
    await new Promise((resolve) => setImmediate(resolve));

    const executions = await prisma.execution.findMany({ where: { testId: test.id } });
    expect(executions).toHaveLength(1);
    expect(executions[0]?.status).toBe("running");
    expect(executions[0]?.finishedAt).toBeNull();

    resolveRun();
    await resultPromise;
  });

  it("transitions the Execution to status pass and sets finishedAt when the runner succeeds", async () => {
    const test = await createTest();
    const runner = vi.fn().mockResolvedValue(undefined);

    const { executionId } = await executeTest(prisma, test.id, steps, runner);

    expect(runner).toHaveBeenCalledWith(steps);

    const execution = await prisma.execution.findUnique({ where: { id: executionId } });
    expect(execution).not.toBeNull();
    expect(execution?.status).toBe("pass");
    expect(execution?.finishedAt).not.toBeNull();
  });

  it("catches an error from the runner, transitions the Execution to status fail, and stores the error in the log instead of throwing", async () => {
    const test = await createTest();
    const runner = vi.fn().mockRejectedValue(new Error("Element not found: #login-button"));

    await expect(executeTest(prisma, test.id, steps, runner)).resolves.toMatchObject({
      executionId: expect.any(String),
    });

    const executions = await prisma.execution.findMany({ where: { testId: test.id } });
    expect(executions).toHaveLength(1);
    expect(executions[0]?.status).toBe("fail");
    expect(executions[0]?.finishedAt).not.toBeNull();
    expect(executions[0]?.log).toMatch(/Element not found: #login-button/);
  });

  it("strips ANSI escape codes from the error message before storing it in the log", async () => {
    const test = await createTest();
    const ansiMessage =
      "page.goto: net::ERR_NAME_NOT_RESOLVED at https://demopay.test/login\nCall log:\n[2m  - navigating to \"https://demopay.test/login\", waiting until \"load\"[22m\n";
    const runner = vi.fn().mockRejectedValue(new Error(ansiMessage));

    const { executionId } = await executeTest(prisma, test.id, steps, runner);

    const execution = await prisma.execution.findUnique({ where: { id: executionId } });
    expect(execution?.log).not.toMatch(//);
    expect(execution?.log).toBe(
      'page.goto: net::ERR_NAME_NOT_RESOLVED at https://demopay.test/login\nCall log:\n  - navigating to "https://demopay.test/login", waiting until "load"\n',
    );
  });
});
