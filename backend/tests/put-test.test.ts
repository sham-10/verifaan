import { describe, expect, it } from "vitest";
import supertest from "supertest";
import { PrismaClient } from "@prisma/client";
import { buildServer } from "../src/app.js";

const prisma = new PrismaClient();

describe("PUT /tests/:id", () => {
  it("replaces the test's name and steps with the new data", async () => {
    const project = await prisma.project.create({
      data: { name: "Checkout flow", description: "Tests for checkout" },
    });

    const test = await prisma.test.create({
      data: { name: "Add item to cart", projectId: project.id },
    });

    const originalStep = await prisma.step.create({
      data: {
        testId: test.id,
        order: 1,
        action: "click",
        targetType: "css",
        targetValue: "#add-to-cart",
      },
    });

    const app = buildServer();
    await app.ready();

    const payload = {
      name: "Add item to cart and checkout",
      steps: [
        {
          action: "input",
          target: { type: "css", value: "#promo-code" },
          value: "SAVE10",
        },
        {
          action: "click",
          target: { type: "css", value: "#checkout" },
        },
      ],
    };

    const response = await supertest(app.server).put(`/tests/${test.id}`).send(payload);

    expect(response.status).toBe(200);

    const updatedTest = await prisma.test.findUnique({
      where: { id: test.id },
      include: { steps: true },
    });

    expect(updatedTest?.name).toBe(payload.name);
    expect(updatedTest?.steps).toHaveLength(payload.steps.length);
    expect(updatedTest?.steps).toEqual(
      expect.arrayContaining(
        payload.steps.map((step) =>
          expect.objectContaining({
            action: step.action,
            targetType: step.target.type,
            targetValue: step.target.value,
            value: step.value ?? null,
          }),
        ),
      ),
    );

    const originalStepStillExists = await prisma.step.findUnique({
      where: { id: originalStep.id },
    });
    expect(originalStepStillExists).toBeNull();

    await app.close();
  });

  it("returns steps with a nested target object, per ADR-004 / the API Contract", async () => {
    const project = await prisma.project.create({
      data: { name: "Checkout flow", description: "Tests for checkout" },
    });

    const test = await prisma.test.create({
      data: { name: "Add item to cart", projectId: project.id },
    });

    const app = buildServer();
    await app.ready();

    const payload = {
      name: "Add item to cart and checkout",
      steps: [
        {
          action: "click",
          target: { type: "css", value: "#checkout" },
        },
      ],
    };

    const response = await supertest(app.server).put(`/tests/${test.id}`).send(payload);

    expect(response.body.steps[0].target).toEqual({
      type: "css",
      value: "#checkout",
    });
    expect(response.body.steps[0].targetType).toBeUndefined();
    expect(response.body.steps[0].targetValue).toBeUndefined();

    await app.close();
  });
});
