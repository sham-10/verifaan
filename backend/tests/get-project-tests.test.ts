import { describe, expect, it } from "vitest";
import supertest from "supertest";
import { PrismaClient } from "@prisma/client";
import { buildServer } from "../src/app.js";

const prisma = new PrismaClient();

describe("GET /projects/:id/tests", () => {
  it("responds with 200 and an array containing the project's tests", async () => {
    const project = await prisma.project.create({
      data: { name: "Checkout flow", description: "Tests for checkout" },
    });
    const testA = await prisma.test.create({
      data: { name: "Add item to cart", projectId: project.id },
    });
    const testB = await prisma.test.create({
      data: { name: "Remove item from cart", projectId: project.id },
    });

    const app = buildServer();
    await app.ready();

    const response = await supertest(app.server).get(`/projects/${project.id}/tests`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: testA.id, name: testA.name }),
        expect.objectContaining({ id: testB.id, name: testB.name }),
      ]),
    );

    await app.close();
  });
});
