import { beforeEach, describe, expect, it } from "vitest";
import supertest from "supertest";
import { PrismaClient } from "@prisma/client";
import { buildServer } from "../src/app.js";

const prisma = new PrismaClient();

describe("Settings", () => {
  beforeEach(async () => {
    await prisma.settings.deleteMany();
  });

  it("GET /settings creates and returns the default settings on first call", async () => {
    const app = buildServer();
    await app.ready();

    const response = await supertest(app.server).get("/settings");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ headless: true });

    await app.close();
  });

  it("GET /settings returns the existing settings on subsequent calls, without creating another row", async () => {
    const app = buildServer();
    await app.ready();

    const response = await supertest(app.server).get("/settings");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ headless: true });

    await app.close();
  });

  it("PUT /settings updates headless, and a subsequent GET reflects the change", async () => {
    const app = buildServer();
    await app.ready();

    const putResponse = await supertest(app.server)
      .put("/settings")
      .send({ headless: false });

    expect(putResponse.status).toBe(200);
    expect(putResponse.body).toEqual({ headless: false });

    const getResponse = await supertest(app.server).get("/settings");

    expect(getResponse.status).toBe(200);
    expect(getResponse.body).toEqual({ headless: false });

    await app.close();
  });
});
