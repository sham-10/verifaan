import { afterEach, describe, expect, it, vi } from "vitest";
import supertest from "supertest";
import { PrismaClient } from "@prisma/client";
import { chromium } from "playwright";
import { buildServer } from "../src/app.js";

vi.mock("playwright", () => ({
  chromium: {
    launch: vi.fn().mockResolvedValue({
      newPage: vi.fn().mockResolvedValue({}),
      close: vi.fn().mockResolvedValue(undefined),
    }),
  },
}));

const prisma = new PrismaClient();

async function createTest() {
  const project = await prisma.project.create({
    data: { name: "Checkout flow", description: "Tests for checkout" },
  });

  return prisma.test.create({
    data: { name: "Add item to cart", projectId: project.id },
  });
}

describe("POST /tests/:id/run — headless setting", () => {
  afterEach(() => {
    vi.mocked(chromium.launch).mockClear();
  });

  it("reads headless from the Settings row and passes it to chromium.launch", async () => {
    await prisma.settings.upsert({
      where: { id: "singleton" },
      update: { headless: false },
      create: { id: "singleton", headless: false },
    });

    const test = await createTest();
    const app = buildServer();
    await app.ready();

    await supertest(app.server).post(`/tests/${test.id}/run`);

    await vi.waitFor(() => expect(chromium.launch).toHaveBeenCalled());
    expect(chromium.launch).toHaveBeenCalledWith({ headless: false });

    await app.close();
  });

  it("defaults to headless: true when no Settings row exists", async () => {
    await prisma.settings.deleteMany();

    const test = await createTest();
    const app = buildServer();
    await app.ready();

    await supertest(app.server).post(`/tests/${test.id}/run`);

    await vi.waitFor(() => expect(chromium.launch).toHaveBeenCalled());
    expect(chromium.launch).toHaveBeenCalledWith({ headless: true });

    await app.close();
  });
});
