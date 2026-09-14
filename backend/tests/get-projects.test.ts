import { describe, expect, it } from "vitest";
import supertest from "supertest";
import { PrismaClient } from "@prisma/client";
import { buildServer } from "../src/app.js";

const prisma = new PrismaClient();

describe("GET /projects", () => {
  it("responds with 200 and an array containing the existing projects", async () => {
    const projectA = await prisma.project.create({
      data: { name: "Checkout flow", description: "Tests for checkout" },
    });
    const projectB = await prisma.project.create({
      data: { name: "Login flow", description: "Tests for login" },
    });

    const app = buildServer();
    await app.ready();

    const response = await supertest(app.server).get("/projects");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: projectA.id, name: projectA.name }),
        expect.objectContaining({ id: projectB.id, name: projectB.name }),
      ]),
    );

    await app.close();
  });
});
