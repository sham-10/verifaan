import { describe, expect, it } from "vitest";
import supertest from "supertest";
import { PrismaClient } from "@prisma/client";
import { buildServer } from "../src/app.js";

const prisma = new PrismaClient();

describe("GET /tests/:id", () => {
  it("responds with 200 and the test including its steps", async () => {
    const project = await prisma.project.create({
      data: { name: "Checkout flow", description: "Tests for checkout" },
    });

    const test = await prisma.test.create({
      data: { name: "Add item to cart", projectId: project.id },
    });

    const stepA = await prisma.step.create({
      data: {
        testId: test.id,
        order: 1,
        action: "click",
        targetType: "css",
        targetValue: "#add-to-cart",
      },
    });

    const stepB = await prisma.step.create({
      data: {
        testId: test.id,
        order: 2,
        action: "assert",
        targetType: "css",
        targetValue: "#cart-count",
        value: "1",
      },
    });

    const app = buildServer();
    await app.ready();

    const response = await supertest(app.server).get(`/tests/${test.id}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ id: test.id, name: test.name });
    expect(response.body.steps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: stepA.id }),
        expect.objectContaining({ id: stepB.id }),
      ]),
    );

    await app.close();
  });
});
