import Fastify from "fastify";
import cors from "@fastify/cors";
import { PrismaClient } from "@prisma/client";
import { chromium } from "playwright";
import type { Page } from "playwright";
import { executeTest } from "./execution/executeTest.js";
import { runSteps } from "./execution/runSteps.js";
import { resolveCandidates } from "./execution/resolveCandidates.js";
import type { Candidate } from "./execution/scoreCandidates.js";

const prisma = new PrismaClient();

const ALLOWED_STEP_ACTIONS = ["navigate", "input", "click", "verify"] as const;

function hasOnlyValidStepActions(steps: Array<{ action: string }>): boolean {
  return steps.every((step) =>
    (ALLOWED_STEP_ACTIONS as readonly string[]).includes(step.action),
  );
}

// The DB stores each step's target as flat targetType/targetValue columns,
// but ADR-004 and the API Contract define the wire shape as a nested
// target: { type, value } object, matching how the frontend (and Prisma's
// own step-create payload) already model it. Reshape DB rows to that
// documented shape before sending them out.
function serializeStep(step: {
  targetType: string;
  targetValue: string;
  [key: string]: unknown;
}) {
  const { targetType, targetValue, ...rest } = step;
  return { ...rest, target: { type: targetType, value: targetValue } };
}

function serializeTest<T extends { steps: Array<Parameters<typeof serializeStep>[0]> }>(
  test: T,
) {
  return { ...test, steps: test.steps.map(serializeStep) };
}

interface DbStep {
  id: string;
  order: number;
  action: string;
  targetType: string;
  targetValue: string;
  value: string | null;
}

interface RunnerStep {
  id: string;
  action: string;
  target: { type: string; value: string };
  value?: string;
}

// The runner (Playwright) works off ADR-004's { type, value } target shape,
// in step order, rather than the DB's flat targetType/targetValue columns.
function toRunnerSteps(dbSteps: DbStep[]): RunnerStep[] {
  return dbSteps
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((step) => ({
      id: step.id,
      action: step.action,
      target: { type: step.targetType, value: step.targetValue },
      ...(step.value !== null ? { value: step.value } : {}),
    }));
}

async function getHeadlessSetting(prisma: PrismaClient): Promise<boolean> {
  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
  return settings?.headless ?? true;
}

// Drives one Test run in a real browser: launches Chromium, runs the steps,
// and always closes the browser afterwards. This is the runner handed to
// executeTest, which is responsible for recording the Execution's outcome.
async function runStepsInBrowser(steps: RunnerStep[], headless: boolean): Promise<void> {
  const browser = await chromium.launch({ headless });
  try {
    const page = await browser.newPage();
    await runSteps(page, steps);
  } finally {
    await browser.close();
  }
}

// Kicks off a Test run in the background and resolves with the new
// Execution's id as soon as it's created, without waiting for the run
// itself to finish. executeTest keeps running after this resolves, and
// records the pass/fail outcome once the browser run settles.
function startExecution(
  prisma: PrismaClient,
  testId: string,
  steps: RunnerStep[],
  headless: boolean,
): Promise<string> {
  return new Promise((resolveExecutionId) => {
    void executeTest(
      prisma,
      testId,
      steps,
      (steps) => runStepsInBrowser(steps, headless),
      resolveExecutionId,
    );
  });
}

const SCANNABLE_TAGS = ["input", "button", "a", "select"] as const;
type ScannableTag = (typeof SCANNABLE_TAGS)[number];

// Maps the DOM tag name to the category key it's grouped under in a scan's
// response; every other key here besides "a" -> "link" is just the tag name.
const CATEGORY_BY_TAG: Record<ScannableTag, string> = {
  input: "input",
  button: "button",
  a: "link",
  select: "select",
};

interface ScannedElement {
  tag: string;
  candidates: Candidate[];
}

// Navigates to the URL and ranks selector candidates (VFN-31/32/33) for
// every genuinely interactive element on the page -- inputs, buttons,
// links, and selects -- grouped by category. Generic text elements
// (p, div, span, headings, ...) are never queried or scored.
async function scanPage(
  page: Page,
  url: string,
): Promise<Record<string, ScannedElement[]>> {
  await page.goto(url);

  const elements: Record<string, ScannedElement[]> = {
    input: [],
    button: [],
    link: [],
    select: [],
  };

  const handles = await page.$$(SCANNABLE_TAGS.join(", "));

  for (const handle of handles) {
    const tag = (await handle.evaluate((el) =>
      (el as Element).tagName.toLowerCase(),
    )) as ScannableTag;
    const candidates = await resolveCandidates(handle, page);
    elements[CATEGORY_BY_TAG[tag]]!.push({ tag, candidates });
  }

  return elements;
}

export function buildServer() {
  const app = Fastify();

  app.register(cors, {
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  });

  app.get("/health", async () => {
    return { status: "ok" };
  });

  app.get("/settings", async () => {
    const settings = await prisma.settings.upsert({
      where: { id: "singleton" },
      update: {},
      create: { id: "singleton" },
    });

    return { headless: settings.headless };
  });

  app.put<{ Body: { headless: boolean } }>("/settings", async (request) => {
    const { headless } = request.body;

    const settings = await prisma.settings.upsert({
      where: { id: "singleton" },
      update: { headless },
      create: { id: "singleton", headless },
    });

    return { headless: settings.headless };
  });

  app.get("/projects", async () => {
    return prisma.project.findMany();
  });

  app.post<{ Body: { name: string; description?: string } }>(
    "/projects",
    async (request, reply) => {
      const { name, description } = request.body;

      const project = await prisma.project.create({
        data: { name, description },
      });

      return reply.status(201).send(project);
    },
  );

  app.post<{
    Params: { id: string };
    Body: {
      name: string;
      steps?: Array<{
        action: string;
        target: { type: string; value: string };
        value?: string;
      }>;
    };
  }>("/projects/:id/tests", async (request, reply) => {
    const { id } = request.params;
    const { name, steps } = request.body;

    if (steps && !hasOnlyValidStepActions(steps)) {
      return reply.status(400).send();
    }

    const test = await prisma.test.create({
      data: { name, projectId: id },
    });

    return reply.status(201).send(test);
  });

  app.get<{ Params: { id: string } }>("/projects/:id/tests", async (request, reply) => {
    const { id } = request.params;

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return reply.status(404).send();
    }

    return prisma.test.findMany({ where: { projectId: id } });
  });

  app.get<{ Params: { id: string } }>("/tests/:id", async (request, reply) => {
    const { id } = request.params;

    const test = await prisma.test.findUnique({
      where: { id },
      include: { steps: true },
    });

    if (!test) {
      return reply.status(404).send();
    }

    return serializeTest(test);
  });

  app.get<{ Params: { id: string } }>("/tests/:id/executions", async (request, reply) => {
    const { id } = request.params;

    const test = await prisma.test.findUnique({ where: { id } });
    if (!test) {
      return reply.status(404).send();
    }

    return prisma.execution.findMany({
      where: { testId: id },
      orderBy: { startedAt: "desc" },
    });
  });

  app.put<{
    Params: { id: string };
    Body: {
      name: string;
      steps: Array<{
        action: string;
        target: { type: string; value: string };
        value?: string;
      }>;
    };
  }>("/tests/:id", async (request, reply) => {
    const { id } = request.params;
    const { name, steps } = request.body;

    const existing = await prisma.test.findUnique({ where: { id } });
    if (!existing) {
      return reply.status(404).send();
    }

    if (!hasOnlyValidStepActions(steps)) {
      return reply.status(400).send();
    }

    const updatedTest = await prisma.$transaction(async (tx) => {
      await tx.step.deleteMany({ where: { testId: id } });

      return tx.test.update({
        where: { id },
        data: {
          name,
          steps: {
            create: steps.map((step, index) => ({
              order: index + 1,
              action: step.action,
              targetType: step.target.type,
              targetValue: step.target.value,
              value: step.value,
            })),
          },
        },
        include: { steps: true },
      });
    });

    return serializeTest(updatedTest);
  });

  app.post<{ Params: { id: string } }>("/tests/:id/run", async (request, reply) => {
    const { id } = request.params;

    const test = await prisma.test.findUnique({
      where: { id },
      include: { steps: true },
    });

    if (!test) {
      return reply.status(404).send();
    }

    const steps = toRunnerSteps(test.steps);
    const headless = await getHeadlessSetting(prisma);
    const executionId = await startExecution(prisma, id, steps, headless);

    return reply.status(202).send({ executionId });
  });

  app.get<{ Params: { id: string } }>("/executions/:id", async (request, reply) => {
    const { id } = request.params;

    const execution = await prisma.execution.findUnique({ where: { id } });

    if (!execution) {
      return reply.status(404).send();
    }

    return execution;
  });

  app.delete<{ Params: { id: string } }>("/tests/:id", async (request, reply) => {
    const { id } = request.params;

    const existing = await prisma.test.findUnique({ where: { id } });
    if (!existing) {
      return reply.status(404).send();
    }

    await prisma.$transaction(async (tx) => {
      await tx.step.deleteMany({ where: { testId: id } });
      await tx.test.delete({ where: { id } });
    });

    return reply.status(204).send();
  });

  app.post<{ Body: { url: string } }>("/scan", async (request, reply) => {
    const { url } = request.body;

    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      const elements = await scanPage(page, url);
      return { url, elements };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return reply.status(400).send({ error: message });
    } finally {
      await browser.close();
    }
  });

  return app;
}
