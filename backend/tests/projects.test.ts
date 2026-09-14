import { describe, expect, it } from "vitest";
import supertest from "supertest";
import { PrismaClient } from "@prisma/client";
import { buildServer } from "../src/app.js";

const prisma = new PrismaClient();

describe("POST /projects", () => {
  it("creates a project and responds with 201 and the created project", async () => {
    const app = buildServer();
    await app.ready();

    const payload = { name: "Checkout flow", description: "Tests for checkout" };

    const response = await supertest(app.server).post("/projects").send(payload);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject(payload);
    expect(response.body.id).toEqual(expect.any(String));

    const stored = await prisma.project.findUnique({ where: { id: response.body.id } });
    expect(stored).not.toBeNull();
    expect(stored?.name).toBe(payload.name);
    expect(stored?.description).toBe(payload.description);

    await app.close();
  });
});
