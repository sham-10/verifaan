import { describe, expect, it } from "vitest";
import supertest from "supertest";
import { PrismaClient } from "@prisma/client";
import { buildServer } from "../src/app.js";

const prisma = new PrismaClient();

describe("GET /tests/:id/executions", () => {
  it("responds with 200 and the test's executions ordered by startedAt descending", async () => {
    const project = await prisma.project.create({
      data: { name: "Checkout flow", description: "Tests for checkout" },
    });

    const test = await prisma.test.create({
      data: { name: "Add item to cart", projectId: project.id },
    });

    const oldest = await prisma.execution.create({
      data: {
        testId: test.id,
        status: "pass",
        startedAt: new Date("2026-01-01T00:00:00.000Z"),
        finishedAt: new Date("2026-01-01T00:00:05.000Z"),
        log: "first run",
      },
    });

    const newest = await prisma.execution.create({
      data: {
        testId: test.id,
        status: "fail",
        startedAt: new Date("2026-01-03T00:00:00.000Z"),
        finishedAt: new Date("2026-01-03T00:00:05.000Z"),
        log: "third run",
      },
    });

    const middle = await prisma.execution.create({
      data: {
        testId: test.id,
        status: "running",
        startedAt: new Date("2026-01-02T00:00:00.000Z"),
        finishedAt: null,
        log: "second run",
      },
    });

    const app = buildServer();
    await app.ready();

    const response = await supertest(app.server).get(`/tests/${test.id}/executions`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(3);
    expect(response.body.map((execution: { id: string }) => execution.id)).toEqual([
      newest.id,
      middle.id,
      oldest.id,
    ]);
    expect(response.body[0]).toMatchObject({
      id: newest.id,
      status: "fail",
      log: "third run",
    });
    expect(response.body[0]).toHaveProperty("startedAt");
    expect(response.body[0]).toHaveProperty("finishedAt");

    await app.close();
  });

  it("responds with 404 when the Test doesn't exist", async () => {
    const app = buildServer();
    await app.ready();

    const response = await supertest(app.server).get("/tests/nonexistent-id/executions");

    expect(response.status).toBe(404);

    await app.close();
  });
});
