import Fastify from "fastify";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ALLOWED_STEP_ACTIONS = ["navigate", "input", "click", "verify"] as const;

function hasOnlyValidStepActions(steps: Array<{ action: string }>): boolean {
  return steps.every((step) =>
    (ALLOWED_STEP_ACTIONS as readonly string[]).includes(step.action),
  );
}

export function buildServer() {
  const app = Fastify();

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

    return test;
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

    return updatedTest;
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
