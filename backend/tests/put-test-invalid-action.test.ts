import { describe, expect, it } from "vitest";
import supertest from "supertest";
import { PrismaClient } from "@prisma/client";
import { buildServer } from "../src/app.js";

const prisma = new PrismaClient();

describe("PUT /tests/:id with an invalid step action", () => {
  it("responds with 400 and does not modify the test's steps", async () => {
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
          action: "fill",
          target: { type: "css", value: "#promo-code" },
        },
      ],
    };

    const response = await supertest(app.server).put(`/tests/${test.id}`).send(payload);

    expect(response.status).toBe(400);

    const unchangedStep = await prisma.step.findUnique({
      where: { id: originalStep.id },
    });
    expect(unchangedStep).not.toBeNull();

    await app.close();
  });
});
