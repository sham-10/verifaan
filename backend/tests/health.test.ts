import { describe, expect, it } from "vitest";
import supertest from "supertest";
import { buildServer } from "../src/app.js";

describe("GET /health", () => {
  it("responds with 200 and a status ok payload", async () => {
    const app = buildServer();
    await app.ready();

    const response = await supertest(app.server).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });

    await app.close();
  });
});
