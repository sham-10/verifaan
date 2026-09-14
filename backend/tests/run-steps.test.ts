import { describe, expect, it, vi } from "vitest";
import type { Page } from "playwright";
import { runSteps } from "../src/execution/runSteps.js";

// A step, per ADR-004: id, action (navigate | input | click | verify),
// target: { type, value }, and an optional value (used by input).
interface Step {
  id: string;
  action: string;
  target: { type: string; value: string };
  value?: string;
}

function createMockPage() {
  return {
    goto: vi.fn(),
    fill: vi.fn(),
    click: vi.fn(),
    waitForSelector: vi.fn(),
  };
}

describe("runSteps", () => {
  it("calls page.goto for a navigate step", async () => {
    const page = createMockPage();
    const steps: Step[] = [
      {
        id: "step-1",
        action: "navigate",
        target: { type: "url", value: "https://demopay.test/login" },
      },
    ];

    await runSteps(page as unknown as Page, steps);

    expect(page.goto).toHaveBeenCalledWith("https://demopay.test/login");
  });

  it("calls page.fill with the target selector and value for an input step", async () => {
    const page = createMockPage();
    const steps: Step[] = [
      {
        id: "step-1",
        action: "input",
        target: { type: "locator", value: "#username" },
        value: "${username}",
      },
    ];

    await runSteps(page as unknown as Page, steps);

    expect(page.fill).toHaveBeenCalledWith("#username", "${username}");
  });

  it("calls page.click with the target selector for a click step", async () => {
    const page = createMockPage();
    const steps: Step[] = [
      {
        id: "step-1",
        action: "click",
        target: { type: "locator", value: "#login-button" },
      },
    ];

    await runSteps(page as unknown as Page, steps);

    expect(page.click).toHaveBeenCalledWith("#login-button");
  });

  it("calls page.waitForSelector with the target selector, visible, for a verify step", async () => {
    const page = createMockPage();
    const steps: Step[] = [
      {
        id: "step-1",
        action: "verify",
        target: { type: "locator", value: "#dashboard-heading" },
      },
    ];

    await runSteps(page as unknown as Page, steps);

    expect(page.waitForSelector).toHaveBeenCalledWith("#dashboard-heading", {
      state: "visible",
    });
  });

  it("runs all four action types in order against the same page", async () => {
    const page = createMockPage();
    const steps: Step[] = [
      {
        id: "step-1",
        action: "navigate",
        target: { type: "url", value: "https://demopay.test/login" },
      },
      {
        id: "step-2",
        action: "input",
        target: { type: "locator", value: "#username" },
        value: "demo_user",
      },
      {
        id: "step-3",
        action: "click",
        target: { type: "locator", value: "#login-button" },
      },
      {
        id: "step-4",
        action: "verify",
        target: { type: "locator", value: "#dashboard-heading" },
      },
    ];

    await runSteps(page as unknown as Page, steps);

    expect(page.goto).toHaveBeenCalledWith("https://demopay.test/login");
    expect(page.fill).toHaveBeenCalledWith("#username", "demo_user");
    expect(page.click).toHaveBeenCalledWith("#login-button");
    expect(page.waitForSelector).toHaveBeenCalledWith("#dashboard-heading", {
      state: "visible",
    });
  });

  it("throws a clear error for an unrecognized action type, instead of silently doing nothing", async () => {
    const page = createMockPage();
    const steps: Step[] = [
      {
        id: "step-1",
        action: "hover",
        target: { type: "locator", value: "#menu" },
      },
    ];

    await expect(runSteps(page as unknown as Page, steps)).rejects.toThrow(
      /unrecognized action.*hover/i,
    );

    expect(page.goto).not.toHaveBeenCalled();
    expect(page.fill).not.toHaveBeenCalled();
    expect(page.click).not.toHaveBeenCalled();
    expect(page.waitForSelector).not.toHaveBeenCalled();
  });
});
