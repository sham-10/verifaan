import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ElementHandle, Page } from "playwright";
import { extractElementFacts } from "../src/execution/extractElementFacts.js";
import { scoreCandidates } from "../src/execution/scoreCandidates.js";
import { resolveCandidates } from "../src/execution/resolveCandidates.js";

vi.mock("../src/execution/extractElementFacts.js", () => ({
  extractElementFacts: vi.fn(),
}));

vi.mock("../src/execution/scoreCandidates.js", () => ({
  scoreCandidates: vi.fn(),
  BASE_PRIORITY: {
    testId: 100,
    id: 100,
    name: 90,
    text: 85,
    classPrefix: 70,
    class: 50,
    position: 30,
    compound: 100,
  },
}));

const targetFacts = { tag: "span" } as never;
const ancestorLvl1Facts = { tag: "div" } as never;
const ancestorLvl2Facts = { tag: "section" } as never;

const targetOwnCandidates = [
  { type: "text", value: "Buy", score: 40 },
  { type: "position", value: { tag: "span", index: 1 }, score: 30 },
];
const ancestorLvl1OwnCandidates = [
  { type: "class", value: "row", score: 55 },
];
const ancestorLvl2OwnCandidates = [
  { type: "testId", value: "checkout-card", score: 100 },
];

// Chained-locator counts for the compound uniqueness recheck, one per
// ancestor level attempted: level 1 stays ambiguous (5 matches -> low
// score), level 2 resolves uniquely (1 match -> full score) and climbing
// should stop there, never reaching level 3.
function createMockPage(compoundMatchCountsByLevel: number[]) {
  let callIndex = 0;
  return {
    locator: vi.fn(() => ({
      locator: vi.fn(() => ({
        count: vi.fn(async () => compoundMatchCountsByLevel[callIndex++]),
      })),
    })),
  };
}

function createMockElement(name: string) {
  return { evaluateHandle: vi.fn(), __name: name };
}

describe("resolveCandidates", () => {
  beforeEach(() => {
    vi.mocked(extractElementFacts).mockReset();
    vi.mocked(scoreCandidates).mockReset();
  });

  it("climbs ancestors only as far as needed and appends a compound candidate per level attempted", async () => {
    const target = createMockElement("target");
    const ancestorLvl1 = createMockElement("ancestorLvl1");
    const ancestorLvl2 = createMockElement("ancestorLvl2");

    target.evaluateHandle.mockResolvedValueOnce({
      asElement: () => ancestorLvl1,
    });
    ancestorLvl1.evaluateHandle.mockResolvedValueOnce({
      asElement: () => ancestorLvl2,
    });

    vi.mocked(extractElementFacts)
      .mockResolvedValueOnce(targetFacts)
      .mockResolvedValueOnce(ancestorLvl1Facts)
      .mockResolvedValueOnce(ancestorLvl2Facts);

    vi.mocked(scoreCandidates)
      .mockResolvedValueOnce(targetOwnCandidates as never)
      .mockResolvedValueOnce(ancestorLvl1OwnCandidates as never)
      .mockResolvedValueOnce(ancestorLvl2OwnCandidates as never);

    const page = createMockPage([5, 1]);

    const result = await resolveCandidates(
      target as unknown as ElementHandle,
      page as unknown as Page,
    );

    // Stopped at ancestor level 2: exactly 3 fact/score extractions total
    // (target + 2 ancestors), never a 3rd ancestor.
    expect(extractElementFacts).toHaveBeenCalledTimes(3);
    expect(scoreCandidates).toHaveBeenCalledTimes(3);
    expect(ancestorLvl2.evaluateHandle).not.toHaveBeenCalled();

    const compoundCandidates = result.filter((c) => c.type === "compound");
    expect(compoundCandidates).toHaveLength(2);

    expect(compoundCandidates[0]).toEqual({
      type: "compound",
      value: {
        parent: ancestorLvl1OwnCandidates[0],
        child: targetOwnCandidates[0],
      },
      // base = min(class=50, text=85) = 50; round(50 / 5) = 10
      score: 10,
    });

    expect(compoundCandidates[1]).toEqual({
      type: "compound",
      value: {
        parent: ancestorLvl2OwnCandidates[0],
        child: targetOwnCandidates[0],
      },
      // base = min(testId=100, text=85) = 85; unique match keeps full base
      score: 85, // above the 80% threshold -- climbing stops here
    });

    // The target's own ranked list is appended to, not replaced.
    expect(result).toEqual(
      expect.arrayContaining(targetOwnCandidates as never[]),
    );
  });

  it("does not climb at all when the target's own best candidate already scores 80 or above", async () => {
    const target = createMockElement("target");
    const strongTargetCandidates = [{ type: "testId", value: "ok", score: 90 }];

    vi.mocked(extractElementFacts).mockResolvedValueOnce(targetFacts);
    vi.mocked(scoreCandidates).mockResolvedValueOnce(
      strongTargetCandidates as never,
    );

    const page = createMockPage([]);

    const result = await resolveCandidates(
      target as unknown as ElementHandle,
      page as unknown as Page,
    );

    expect(target.evaluateHandle).not.toHaveBeenCalled();
    expect(extractElementFacts).toHaveBeenCalledTimes(1);
    expect(result).toEqual(strongTargetCandidates);
  });

  it("stops at the max depth of 3 levels even if no compound candidate ever resolves the ambiguity", async () => {
    const target = createMockElement("target");
    const ancestorLvl1 = createMockElement("ancestorLvl1");
    const ancestorLvl2 = createMockElement("ancestorLvl2");
    const ancestorLvl3 = createMockElement("ancestorLvl3");

    target.evaluateHandle.mockResolvedValueOnce({
      asElement: () => ancestorLvl1,
    });
    ancestorLvl1.evaluateHandle.mockResolvedValueOnce({
      asElement: () => ancestorLvl2,
    });
    ancestorLvl2.evaluateHandle.mockResolvedValueOnce({
      asElement: () => ancestorLvl3,
    });

    vi.mocked(extractElementFacts)
      .mockResolvedValueOnce(targetFacts)
      .mockResolvedValueOnce(ancestorLvl1Facts)
      .mockResolvedValueOnce(ancestorLvl2Facts)
      .mockResolvedValueOnce({ tag: "body" } as never);

    vi.mocked(scoreCandidates)
      .mockResolvedValueOnce(targetOwnCandidates as never)
      .mockResolvedValueOnce(ancestorLvl1OwnCandidates as never)
      .mockResolvedValueOnce(ancestorLvl2OwnCandidates as never)
      .mockResolvedValueOnce([{ type: "class", value: "page", score: 40 }] as never);

    // Every level stays ambiguous (never drops to a single match).
    const page = createMockPage([5, 4, 3]);

    const result = await resolveCandidates(
      target as unknown as ElementHandle,
      page as unknown as Page,
    );

    expect(extractElementFacts).toHaveBeenCalledTimes(4); // target + 3 ancestors
    expect(scoreCandidates).toHaveBeenCalledTimes(4);
    expect(ancestorLvl3.evaluateHandle).not.toHaveBeenCalled();

    const compoundCandidates = result.filter((c) => c.type === "compound");
    expect(compoundCandidates).toHaveLength(3);
    // level 1: base = min(class=50, text=85) = 50; round(50 / 5) = 10
    // level 2: base = min(testId=100, text=85) = 85; round(85 / 4) = 21
    // level 3: base = min(class=50, text=85) = 50; round(50 / 3) = 17
    expect(compoundCandidates.map((c) => c.score)).toEqual([10, 21, 17]);
  });
});
