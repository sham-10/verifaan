import { describe, expect, it, vi } from "vitest";
import type { ElementHandle, Page } from "playwright";
import type { ElementFacts } from "../src/execution/extractElementFacts.js";
import { scoreCandidates } from "../src/execution/scoreCandidates.js";

const fullFacts: ElementFacts = {
  id: "submit-btn",
  name: "submit",
  testId: "submit-button",
  text: "Submit",
  tag: "button",
  classList: ["primary", "Button___34wHC", "large"],
  classPrefix: "Button",
};

function createMockPage(countsBySelector: Record<string, number> = {}) {
  return {
    addScriptTag: vi.fn(),
    locator: vi.fn((selector: string) => ({
      count: vi.fn(async () => countsBySelector[selector] ?? 1),
    })),
  };
}

function createMockElement({
  position = 0,
  generatedClassSelector = ".Button___34wHC",
}: {
  position?: number;
  generatedClassSelector?: string;
} = {}) {
  return {
    evaluate: vi
      .fn()
      // 1st call: compute sibling position
      .mockResolvedValueOnce(position)
      // 2nd call: css-selector-generator builds the internal, class-scoped selector
      .mockResolvedValueOnce(generatedClassSelector),
  };
}

describe("scoreCandidates", () => {
  it("gives every present fact its full base score when its live selector matches exactly one element", async () => {
    const page = createMockPage();
    const element = createMockElement();

    const candidates = await scoreCandidates(
      fullFacts,
      element as unknown as ElementHandle,
      page as unknown as Page,
    );

    expect(candidates).toEqual(
      expect.arrayContaining([
        { type: "testId", value: "submit-button", score: 100 },
        { type: "id", value: "submit-btn", score: 100 },
        { type: "name", value: "submit", score: 90 },
        { type: "text", value: "Submit", score: 85 },
        { type: "classPrefix", value: "Button", score: 70 },
        { type: "class", value: "primary Button___34wHC large", score: 50 },
        { type: "position", value: { tag: "button", index: 0 }, score: 30 },
      ]),
    );
    expect(candidates).toHaveLength(7);
  });

  it("scales a candidate's score down when its live selector matches more than one element", async () => {
    const page = createMockPage({
      '[data-testid="submit-button"]': 1,
      ".Button___34wHC": 4,
    });
    const element = createMockElement();

    const candidates = await scoreCandidates(
      fullFacts,
      element as unknown as ElementHandle,
      page as unknown as Page,
    );

    const testIdCandidate = candidates.find((c) => c.type === "testId");
    const classPrefixCandidate = candidates.find(
      (c) => c.type === "classPrefix",
    );

    expect(testIdCandidate?.score).toBe(100);
    expect(classPrefixCandidate?.score).toBe(18); // round(70 / 4)
  });

  it("omits candidates for absent facts, but always includes the tag+position candidate", async () => {
    const sparseFacts: ElementFacts = {
      id: null,
      name: null,
      testId: null,
      text: null,
      tag: "div",
      classList: null,
      classPrefix: null,
    };
    const page = createMockPage();
    const element = createMockElement({ position: 2 });

    const candidates = await scoreCandidates(
      sparseFacts,
      element as unknown as ElementHandle,
      page as unknown as Page,
    );

    expect(candidates).toEqual([
      { type: "position", value: { tag: "div", index: 2 }, score: 30 },
    ]);
  });

  it("never stores the internally-generated css-selector-generator string as the classPrefix candidate's value", async () => {
    const page = createMockPage();
    const element = createMockElement({
      generatedClassSelector: 'button[class*="Button___34wHC"]',
    });

    const candidates = await scoreCandidates(
      fullFacts,
      element as unknown as ElementHandle,
      page as unknown as Page,
    );

    const classPrefixCandidate = candidates.find(
      (c) => c.type === "classPrefix",
    );

    expect(classPrefixCandidate?.value).toBe("Button");
    expect(classPrefixCandidate?.value).not.toContain("[class*=");
  });

  it("uses css-selector-generator scoped to class selectors to build the internal uniqueness-check selector", async () => {
    const page = createMockPage();
    const element = createMockElement();

    await scoreCandidates(
      fullFacts,
      element as unknown as ElementHandle,
      page as unknown as Page,
    );

    expect(page.addScriptTag).toHaveBeenCalledWith(
      expect.objectContaining({
        path: expect.stringContaining("css-selector-generator"),
      }),
    );
    expect(element.evaluate).toHaveBeenNthCalledWith(
      2,
      expect.any(Function),
      expect.objectContaining({ selectors: ["class"] }),
    );
  });
});
