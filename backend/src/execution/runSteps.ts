import type { Page } from "playwright";

// A step, per ADR-004: id, action (navigate | input | click | verify),
// target: { type, value }, and an optional value (used by input).
interface Step {
  id: string;
  action: string;
  target: { type: string; value: string };
  value?: string;
}

export async function runSteps(page: Page, steps: Step[]): Promise<void> {
  for (const step of steps) {
    switch (step.action) {
      case "navigate":
        await page.goto(step.target.value);
        break;
      case "input":
        await page.fill(step.target.value, step.value ?? "");
        break;
      case "click":
        await page.click(step.target.value);
        break;
      case "verify":
        await page.waitForSelector(step.target.value, { state: "visible" });
        break;
      default:
        throw new Error(`Unrecognized action type: ${step.action}`);
    }
  }
}
