import { describe, expect, it } from "vitest";
import supertest from "supertest";
import { PrismaClient } from "@prisma/client";
import { buildServer } from "../src/app.js";

const prisma = new PrismaClient();

describe("POST /projects/:id/tests", () => {
  it("creates a test under the project and responds with 201 and the created test", async () => {
    const project = await prisma.project.create({
      data: { name: "Checkout flow", description: "Tests for checkout" },
    });

    const app = buildServer();
    await app.ready();

    const payload = { name: "Add item to cart" };

    const response = await supertest(app.server)
      .post(`/projects/${project.id}/tests`)
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      name: payload.name,
      projectId: project.id,
    });
    expect(response.body.id).toEqual(expect.any(String));

    await app.close();
  });
});
