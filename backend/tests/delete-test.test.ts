import { describe, expect, it } from "vitest";
import supertest from "supertest";
import { PrismaClient } from "@prisma/client";
import { buildServer } from "../src/app.js";

const prisma = new PrismaClient();

describe("DELETE /tests/:id", () => {
  it("deletes the test and responds with 200 or 204", async () => {
    const project = await prisma.project.create({
      data: { name: "Checkout flow", description: "Tests for checkout" },
    });

    const test = await prisma.test.create({
      data: { name: "Add item to cart", projectId: project.id },
    });

    const app = buildServer();
    await app.ready();

    const response = await supertest(app.server).delete(`/tests/${test.id}`);

    expect([200, 204]).toContain(response.status);

    const deletedTest = await prisma.test.findUnique({ where: { id: test.id } });
    expect(deletedTest).toBeNull();

    await app.close();
  });
});
