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
  | "position";

export interface PositionValue {
  tag: string;
  index: number;
}

export interface Candidate {
  type: CandidateType;
  value: string | PositionValue;
  score: number;
}

const BASE_PRIORITY: Record<CandidateType, number> = {
  testId: 100,
  id: 100,
  name: 90,
  text: 85,
  classPrefix: 70,
  class: 50,
  position: 30,
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

async function computeSiblingPosition(element: ElementHandle): Promise<number> {
  return element.evaluate((el) => {
    const node = el as Element;
    const siblings = Array.from(node.parentElement?.children ?? []);
    return siblings
      .filter((sibling) => sibling.tagName === node.tagName)
      .indexOf(node);
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
