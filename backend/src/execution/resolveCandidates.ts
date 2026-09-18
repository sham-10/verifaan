import type { ElementHandle, Page } from "playwright";
import { extractElementFacts } from "./extractElementFacts.js";
import {
  scoreCandidates,
  BASE_PRIORITY,
  type Candidate,
} from "./scoreCandidates.js";

const UNIQUENESS_THRESHOLD = 80;
const MAX_ANCESTOR_DEPTH = 3;

export async function resolveCandidates(
  element: ElementHandle,
  page: Page,
  maxDepth = MAX_ANCESTOR_DEPTH,
): Promise<Candidate[]> {
  const targetFacts = await extractElementFacts(element);
  const targetCandidates = await scoreCandidates(targetFacts, element, page);
  const bestTarget = getBestCandidate(targetCandidates);

  if (bestTarget.score >= UNIQUENESS_THRESHOLD) {
    return targetCandidates;
  }

  const compoundCandidates: Candidate[] = [];
  let currentElement = element;

  for (let depth = 0; depth < maxDepth; depth++) {
    const ancestorElement = await getParentElement(currentElement);
    if (!ancestorElement) break;

    const ancestorFacts = await extractElementFacts(ancestorElement);
    const ancestorCandidates = await scoreCandidates(
      ancestorFacts,
      ancestorElement,
      page,
    );
    const ancestorBest = getBestCandidate(ancestorCandidates);

    const matchCount = await page
      .locator(buildLiveSelectorForCandidate(ancestorBest))
      .locator(buildLiveSelectorForCandidate(bestTarget))
      .count();

    const compound = buildCompoundCandidate(ancestorBest, bestTarget, matchCount);
    compoundCandidates.push(compound);

    if (compound.score >= UNIQUENESS_THRESHOLD) break;

    currentElement = ancestorElement;
  }

  return [...targetCandidates, ...compoundCandidates];
}

function getBestCandidate(candidates: Candidate[]): Candidate {
  return candidates.reduce((best, candidate) =>
    candidate.score > best.score ? candidate : best,
  );
}

async function getParentElement(
  element: ElementHandle,
): Promise<ElementHandle | null> {
  const parentHandle = await element.evaluateHandle(
    (el) => (el as Element).parentElement,
  );
  return parentHandle.asElement() as ElementHandle | null;
}

function buildCompoundCandidate(
  parent: Candidate,
  child: Candidate,
  matchCount: number,
): Candidate {
  const basePriority = Math.min(
    BASE_PRIORITY[parent.type],
    BASE_PRIORITY[child.type],
  );
  const score =
    matchCount <= 1 ? basePriority : Math.round(basePriority / matchCount);

  return { type: "compound", value: { parent, child }, score };
}

function buildLiveSelectorForCandidate(candidate: Candidate): string {
  switch (candidate.type) {
    case "testId":
      return `[data-testid="${candidate.value}"]`;
    case "id":
      return `[id="${candidate.value}"]`;
    case "name":
      return `[name="${candidate.value}"]`;
    case "text":
      return `text=${candidate.value as string}`;
    case "classPrefix":
      return `[class*="${candidate.value}"]`;
    case "class":
      return `.${(candidate.value as string).split(" ").join(".")}`;
    case "position": {
      const { tag, index } = candidate.value as {
        tag: string;
        index: number;
      };
      return `${tag}:nth-of-type(${index + 1})`;
    }
    default:
      throw new Error(`Cannot build a selector for candidate type: ${candidate.type}`);
  }
}
