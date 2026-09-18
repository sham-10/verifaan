import { createRequire } from "node:module";
import type { ElementHandle, Page } from "playwright";
import type { ElementFacts } from "./extractElementFacts.js";

const require = createRequire(import.meta.url);
const CSS_SELECTOR_GENERATOR_PATH = require.resolve("css-selector-generator");

export type CandidateType =
  | "testId"
  | "id"
  | "name"
  | "text"
  | "classPrefix"
  | "class"
  | "position"
  | "compound";

export interface PositionValue {
  tag: string;
  index: number;
}

export interface CompoundValue {
  parent: Candidate;
  child: Candidate;
}

export interface Candidate {
  type: CandidateType;
  value: string | PositionValue | CompoundValue;
  score: number;
}

// Shared with resolveCandidates.ts, which derives a compound candidate's
// base priority from the weaker of its parent/child piece.
export const BASE_PRIORITY: Record<CandidateType, number> = {
  testId: 100,
  id: 100,
  name: 90,
  text: 85,
  classPrefix: 70,
  class: 50,
  position: 30,
  compound: 100, // unused directly; compound priority is derived, see above
};

export async function scoreCandidates(
  facts: ElementFacts,
  element: ElementHandle,
  page: Page,
): Promise<Candidate[]> {
  const position = await computeSiblingPosition(element);
  const candidates: Candidate[] = [];

  if (facts.testId) {
    candidates.push(
      await buildScoredCandidate(
        page,
        "testId",
        facts.testId,
        `[data-testid="${facts.testId}"]`,
      ),
    );
  }

  if (facts.id) {
    candidates.push(
      await buildScoredCandidate(page, "id", facts.id, `[id="${facts.id}"]`),
    );
  }

  if (facts.name) {
    candidates.push(
      await buildScoredCandidate(
        page,
        "name",
        facts.name,
        `[name="${facts.name}"]`,
      ),
    );
  }

  if (facts.text) {
    candidates.push(
      await buildScoredCandidate(page, "text", facts.text, `text=${facts.text}`),
    );
  }

  if (facts.classPrefix) {
    const classSelector = await buildClassScopedSelector(element, page);
    candidates.push(
      await buildScoredCandidate(
        page,
        "classPrefix",
        facts.classPrefix,
        classSelector,
      ),
    );
  }

  if (facts.classList) {
    const fullClassValue = facts.classList.join(" ");
    candidates.push(
      await buildScoredCandidate(
        page,
        "class",
        fullClassValue,
        `.${facts.classList.join(".")}`,
      ),
    );
  }

  candidates.push({
    type: "position",
    value: { tag: facts.tag, index: position },
    score: BASE_PRIORITY.position,
  });

  return candidates;
}

async function buildScoredCandidate(
  page: Page,
  type: CandidateType,
  value: string,
  liveSelector: string,
): Promise<Candidate> {
  const matchCount = await page.locator(liveSelector).count();
  return { type, value, score: scoreForMatchCount(type, matchCount) };
}

function scoreForMatchCount(type: CandidateType, matchCount: number): number {
  const basePriority = BASE_PRIORITY[type];
  if (matchCount <= 1) return basePriority;
  return Math.round(basePriority / matchCount);
}

// Index of this element among every same-tag element in the whole page,
// not just its immediate parent's children -- real markup very often wraps
// each field in its own container (e.g. a login form's three <input>s each
// inside their own <div>), so scoping to the immediate parent alone made
// every one of them "the only same-tag child" and reported index 0.
//
// Everything here must be self-contained: Playwright serializes this
// function's source and runs it inside the page, so it can't reference any
// outer module-level helper -- only what's declared inside the callback.
async function computeSiblingPosition(element: ElementHandle): Promise<number> {
  return element.evaluate((el) => {
    const node = el as Element;

    function findRoot(current: Element): Element {
      return current.parentElement ? findRoot(current.parentElement) : current;
    }

    function collectByTagName(current: Element, tagName: string, out: Element[]): Element[] {
      if (current.tagName === tagName) out.push(current);
      for (const child of Array.from(current.children)) {
        collectByTagName(child, tagName, out);
      }
      return out;
    }

    const root = findRoot(node);
    const sameTagElements = collectByTagName(root, node.tagName, []);
    return sameTagElements.indexOf(node);
  });
}

async function buildClassScopedSelector(
  element: ElementHandle,
  page: Page,
): Promise<string> {
  await page.addScriptTag({ path: CSS_SELECTOR_GENERATOR_PATH });
  return element.evaluate(
    (el, opts) =>
      (window as unknown as {
        CssSelectorGenerator: {
          getCssSelector: (target: Element, options: unknown) => string;
        };
      }).CssSelectorGenerator.getCssSelector(el as Element, opts),
    { selectors: ["class"] },
  );
}
