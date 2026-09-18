import type { Locator, Page } from "playwright";

interface PositionValue {
  tag: string;
  index: number;
}

type TargetValue = string | PositionValue | CompoundValue;

interface NeutralCandidate {
  type: string;
  value: TargetValue;
}

interface CompoundValue {
  parent: NeutralCandidate;
  child: NeutralCandidate;
}

// A step, per ADR-004: id, action (navigate | input | click | verify),
// target: { type, value }, and an optional value (used by input).
//
// target.type is either a legacy type ("url", "locator") whose value is
// already a ready-to-use raw selector string, or one of VFN-31..34's
// neutral candidate types (testId, id, name, text, classPrefix, class,
// position, compound), whose value is a plain fact translated into a real
// Playwright call only here -- see CLAUDE.md's "Engine-neutral locators".
interface Step {
  id: string;
  action: string;
  target: NeutralCandidate;
  value?: string;
}

const LEGACY_RAW_SELECTOR_TYPES = new Set(["url", "locator"]);

export async function runSteps(page: Page, steps: Step[]): Promise<void> {
  for (const step of steps) {
    switch (step.action) {
      case "navigate":
        await page.goto(step.target.value as string);
        break;
      case "input":
        await fillTarget(page, step.target, step.value ?? "");
        break;
      case "click":
        await clickTarget(page, step.target);
        break;
      case "verify":
        await waitForTargetVisible(page, step.target);
        break;
      default:
        throw new Error(`Unrecognized action type: ${step.action}`);
    }
  }
}

async function fillTarget(page: Page, target: Step["target"], value: string): Promise<void> {
  if (isLegacyRawSelector(target)) {
    await page.fill(target.value as string, value);
    return;
  }
  await resolveLocator(page, target).fill(value);
}

async function clickTarget(page: Page, target: Step["target"]): Promise<void> {
  if (isLegacyRawSelector(target)) {
    await page.click(target.value as string);
    return;
  }
  await resolveLocator(page, target).click();
}

async function waitForTargetVisible(page: Page, target: Step["target"]): Promise<void> {
  if (isLegacyRawSelector(target)) {
    await page.waitForSelector(target.value as string, { state: "visible" });
    return;
  }
  await resolveLocator(page, target).waitFor({ state: "visible" });
}

function isLegacyRawSelector(target: Step["target"]): boolean {
  return LEGACY_RAW_SELECTOR_TYPES.has(target.type);
}

// Translates a neutral candidate fact into a real, executable Playwright
// Locator. This is the one place live execution turns { type, value } into
// engine-specific syntax -- never baked into stored step data ahead of time.
function resolveLocator(page: Page, target: Step["target"]): Locator {
  switch (target.type) {
    case "testId":
      return page.getByTestId(target.value as string);
    case "id":
      return page.locator(`#${target.value as string}`);
    case "name":
      return page.locator(`[name="${target.value as string}"]`);
    case "text":
      return page.getByText(target.value as string);
    case "classPrefix":
      return page.locator(`[class*="${target.value as string}"]`);
    case "class":
      return page.locator(toChainedClassSelector(target.value as string));
    case "position":
      return page.locator(toPositionSelector(target.value as PositionValue));
    case "compound": {
      const { parent, child } = target.value as CompoundValue;
      return resolveLocator(page, parent).locator(toChildSelector(child));
    }
    default:
      throw new Error(`Cannot resolve a locator for target type: ${target.type}`);
  }
}

// Builds a raw CSS/text-engine selector fragment for a candidate used as
// the child half of a compound target -- Locator.locator() only accepts a
// selector string, not another Locator, so this stays separate from
// resolveLocator's idiomatic-method translations (getByTestId, getByText).
function toChildSelector(candidate: NeutralCandidate): string {
  switch (candidate.type) {
    case "testId":
      return `[data-testid="${candidate.value as string}"]`;
    case "id":
      return `#${candidate.value as string}`;
    case "name":
      return `[name="${candidate.value as string}"]`;
    case "text":
      return `text=${candidate.value as string}`;
    case "classPrefix":
      return `[class*="${candidate.value as string}"]`;
    case "class":
      return toChainedClassSelector(candidate.value as string);
    case "position":
      return toPositionSelector(candidate.value as PositionValue);
    default:
      throw new Error(`Cannot build a child selector for candidate type: ${candidate.type}`);
  }
}

function toChainedClassSelector(fullClassValue: string): string {
  return `.${fullClassValue.split(" ").join(".")}`;
}

function toPositionSelector({ tag, index }: PositionValue): string {
  return `${tag}:nth-of-type(${index + 1})`;
}
