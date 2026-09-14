import Fastify from "fastify";
import cors from "@fastify/cors";
import { PrismaClient } from "@prisma/client";

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

export function buildServer() {
  const app = Fastify();

  app.register(cors, {
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  });

  app.get("/health", async () => {
    return { status: "ok" };
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

  return app;
}
