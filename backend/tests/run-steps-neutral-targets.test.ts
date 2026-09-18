import { describe, expect, it, vi } from "vitest";
import type { Page } from "playwright";
import { runSteps } from "../src/execution/runSteps.js";

// Mirrors runSteps.ts's own (unexported) Step shape, widened to cover the
// non-string candidate values (position, compound) that neutral targets can
// carry -- see CLAUDE.md's "Engine-neutral locators" rule: target.value is
// always a plain fact, translated into a real Playwright call only here,
// inside runSteps, never baked in ahead of time.
interface Step {
  id: string;
  action: string;
  target: {
    type: string;
    value:
      | string
      | { tag: string; index: number }
      | { parent: { type: string; value: unknown }; child: { type: string; value: unknown } };
  };
  value?: string;
}

function createMockLocator() {
  return {
    click: vi.fn(),
    fill: vi.fn(),
    waitFor: vi.fn(),
    locator: vi.fn(),
  };
}

function createMockPage() {
  return {
    goto: vi.fn(),
    fill: vi.fn(),
    click: vi.fn(),
    waitForSelector: vi.fn(),
    getByTestId: vi.fn(),
    getByText: vi.fn(),
    locator: vi.fn(),
  };
}

describe("runSteps -- neutral candidate targets (VFN-31..34 output)", () => {
  it("translates a testId target into page.getByTestId(value) and clicks it", async () => {
    const page = createMockPage();
    const locator = createMockLocator();
    page.getByTestId.mockReturnValue(locator);

    const steps: Step[] = [
      {
        id: "step-1",
        action: "click",
        target: { type: "testId", value: "submit-btn" },
      },
    ];

    await runSteps(page as unknown as Page, steps);

    expect(page.getByTestId).toHaveBeenCalledWith("submit-btn");
    expect(locator.click).toHaveBeenCalled();
    // Never falls back to the legacy raw-selector path.
    expect(page.click).not.toHaveBeenCalled();
  });

  it("translates an id target into page.locator('#'+value) and fills it", async () => {
    const page = createMockPage();
    const locator = createMockLocator();
    page.locator.mockReturnValue(locator);

    const steps: Step[] = [
      {
        id: "step-1",
        action: "input",
        target: { type: "id", value: "username" },
        value: "demo_user",
      },
    ];

    await runSteps(page as unknown as Page, steps);

    expect(page.locator).toHaveBeenCalledWith("#username");
    expect(locator.fill).toHaveBeenCalledWith("demo_user");
    expect(page.fill).not.toHaveBeenCalled();
  });

  it("translates a name target into page.locator('[name=\"value\"]') and clicks it", async () => {
    const page = createMockPage();
    const locator = createMockLocator();
    page.locator.mockReturnValue(locator);

    const steps: Step[] = [
      {
        id: "step-1",
        action: "click",
        target: { type: "name", value: "submit" },
      },
    ];

    await runSteps(page as unknown as Page, steps);

    expect(page.locator).toHaveBeenCalledWith('[name="submit"]');
    expect(locator.click).toHaveBeenCalled();
  });

  it("translates a text target into page.getByText(value) and waits for it to be visible", async () => {
    const page = createMockPage();
    const locator = createMockLocator();
    page.getByText.mockReturnValue(locator);

    const steps: Step[] = [
      {
        id: "step-1",
        action: "verify",
        target: { type: "text", value: "Dashboard" },
      },
    ];

    await runSteps(page as unknown as Page, steps);

    expect(page.getByText).toHaveBeenCalledWith("Dashboard");
    expect(locator.waitFor).toHaveBeenCalledWith({ state: "visible" });
    expect(page.waitForSelector).not.toHaveBeenCalled();
  });

  it("translates a classPrefix target into a class-substring locator and clicks it", async () => {
    const page = createMockPage();
    const locator = createMockLocator();
    page.locator.mockReturnValue(locator);

    const steps: Step[] = [
      {
        id: "step-1",
        action: "click",
        target: { type: "classPrefix", value: "Button" },
      },
    ];

    await runSteps(page as unknown as Page, steps);

    expect(page.locator).toHaveBeenCalledWith('[class*="Button"]');
    expect(locator.click).toHaveBeenCalled();
  });

  it("translates a class (full class list) target into a chained class selector and clicks it", async () => {
    const page = createMockPage();
    const locator = createMockLocator();
    page.locator.mockReturnValue(locator);

    const steps: Step[] = [
      {
        id: "step-1",
        action: "click",
        target: { type: "class", value: "primary large" },
      },
    ];

    await runSteps(page as unknown as Page, steps);

    expect(page.locator).toHaveBeenCalledWith(".primary.large");
    expect(locator.click).toHaveBeenCalled();
  });

  it("translates a position target into a tag+nth-of-type structural locator and clicks it", async () => {
    const page = createMockPage();
    const locator = createMockLocator();
    page.locator.mockReturnValue(locator);

    const steps: Step[] = [
      {
        id: "step-1",
        action: "click",
        target: { type: "position", value: { tag: "div", index: 2 } },
      },
    ];

    await runSteps(page as unknown as Page, steps);

    expect(page.locator).toHaveBeenCalledWith("div:nth-of-type(3)");
    expect(locator.click).toHaveBeenCalled();
  });

  it("translates a compound target into a chained parent.locator(child) call and clicks the result", async () => {
    const page = createMockPage();
    const parentLocator = createMockLocator();
    const chainedLocator = createMockLocator();
    page.getByTestId.mockReturnValue(parentLocator);
    parentLocator.locator.mockReturnValue(chainedLocator);

    const steps: Step[] = [
      {
        id: "step-1",
        action: "click",
        target: {
          type: "compound",
          value: {
            parent: { type: "testId", value: "checkout-card" },
            child: { type: "text", value: "Buy" },
          },
        },
      },
    ];

    await runSteps(page as unknown as Page, steps);

    expect(page.getByTestId).toHaveBeenCalledWith("checkout-card");
    expect(parentLocator.locator).toHaveBeenCalledWith("text=Buy");
    expect(chainedLocator.click).toHaveBeenCalled();
  });

  it("recurses through a compound whose own parent is itself a compound (VFN-33's multi-level climbing)", async () => {
    const page = createMockPage();
    // Three levels: grandparent (testId) -> middle child (text) forms the
    // inner compound, which itself becomes the outer compound's parent,
    // chained again with an outer child (classPrefix).
    const grandparentLocator = createMockLocator();
    const innerCompoundLocator = createMockLocator();
    const outerCompoundLocator = createMockLocator();
    page.getByTestId.mockReturnValue(grandparentLocator);
    grandparentLocator.locator.mockReturnValue(innerCompoundLocator);
    innerCompoundLocator.locator.mockReturnValue(outerCompoundLocator);

    const steps: Step[] = [
      {
        id: "step-1",
        action: "click",
        target: {
          type: "compound",
          value: {
            parent: {
              type: "compound",
              value: {
                parent: { type: "testId", value: "checkout-section" },
                child: { type: "text", value: "Featured" },
              },
            },
            child: { type: "classPrefix", value: "Card" },
          },
        },
      },
    ];

    await runSteps(page as unknown as Page, steps);

    // The innermost pair resolves first...
    expect(page.getByTestId).toHaveBeenCalledWith("checkout-section");
    expect(grandparentLocator.locator).toHaveBeenCalledWith("text=Featured");
    // ...then the outer pair chains off of that resolved inner locator.
    expect(innerCompoundLocator.locator).toHaveBeenCalledWith('[class*="Card"]');
    expect(outerCompoundLocator.click).toHaveBeenCalled();
  });

  it("still treats a legacy locator target's value as a ready-to-use raw selector, unchanged", async () => {
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
    expect(page.locator).not.toHaveBeenCalled();
    expect(page.getByTestId).not.toHaveBeenCalled();
  });
});
