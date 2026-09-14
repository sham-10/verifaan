import { describe, expect, it } from "vitest";
import supertest from "supertest";
import { buildServer } from "../src/app.js";

describe("CORS", () => {
  it("allows cross-origin requests from the frontend dev server", async () => {
    const app = buildServer();
    await app.ready();

    const response = await supertest(app.server)
      .get("/health")
      .set("Origin", "http://localhost:5173");

    expect(response.headers["access-control-allow-origin"]).toBe(
      "http://localhost:5173",
    );

    await app.close();
  });

  it("allows PUT and DELETE in the preflight response, not just GET/POST", async () => {
    const app = buildServer();
    await app.ready();

    const response = await supertest(app.server)
      .options("/tests/some-id")
      .set("Origin", "http://localhost:5173")
      .set("Access-Control-Request-Method", "PUT")
      .set("Access-Control-Request-Headers", "content-type");

    const allowedMethods = response.headers["access-control-allow-methods"] ?? "";

    expect(allowedMethods).toContain("PUT");
    expect(allowedMethods).toContain("DELETE");

    await app.close();
  });
});
