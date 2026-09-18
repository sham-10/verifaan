import { describe, expect, it, vi } from "vitest";
import type { ElementHandle, Page } from "playwright";
import type { ElementFacts } from "../src/execution/extractElementFacts.js";
import type { PositionValue } from "../src/execution/scoreCandidates.js";
import { scoreCandidates } from "../src/execution/scoreCandidates.js";

// A plain-object stand-in for a real DOM Element, just enough shape for
// computeSiblingPosition's evaluate callback to walk (tagName,
// parentElement, children). Unlike the other scoreCandidates tests, this
// element's evaluate mock actually INVOKES the function it's given against
// this fake tree, instead of returning a canned value -- that's what lets
// this test genuinely exercise (and catch bugs in) the real position-
// computation logic, rather than just asserting on a stub.
interface FakeNode {
  tagName: string;
  parentElement: FakeNode | null;
  children: FakeNode[];
}

function makeNode(tagName: string, parent: FakeNode | null): FakeNode {
  const node: FakeNode = { tagName: tagName.toUpperCase(), parentElement: parent, children: [] };
  parent?.children.push(node);
  return node;
}

function createDomBackedMockElement(fakeNode: FakeNode) {
  return {
    evaluate: vi.fn((fn: (el: unknown, arg?: unknown) => unknown, arg?: unknown) =>
      Promise.resolve(fn(fakeNode, arg)),
    ),
  };
}

function createMockPage() {
  return {
    addScriptTag: vi.fn(),
    locator: vi.fn(() => ({ count: vi.fn(async () => 1) })),
  };
}

const inputFacts: ElementFacts = {
  id: null,
  name: null,
  testId: null,
  text: null,
  tag: "input",
  classList: null,
  classPrefix: null,
};

describe("scoreCandidates -- position candidate sibling-index bug", () => {
  it("gives three same-tag inputs, each wrapped in its own parent div, three distinct indices (0, 1, 2), not all 0", async () => {
    // Reproduces a real DemoPay login page scan: three <input>s that are
    // NOT direct DOM siblings of each other -- each sits inside its own
    // wrapper <div>, all of those wrappers under a shared <form> root. A
    // position calculation scoped only to "children of the immediate
    // parent" sees exactly one same-tag child in every case and reports
    // index 0 for all three, which is the bug being fixed here.
    const root = makeNode("form", null);
    const input1 = makeNode("input", makeNode("div", root));
    const input2 = makeNode("input", makeNode("div", root));
    const input3 = makeNode("input", makeNode("div", root));

    const page = createMockPage();
    const indices: number[] = [];

    for (const inputNode of [input1, input2, input3]) {
      const element = createDomBackedMockElement(inputNode);
      const candidates = await scoreCandidates(
        inputFacts,
        element as unknown as ElementHandle,
        page as unknown as Page,
      );
      const position = candidates.find((c) => c.type === "position");
      indices.push((position!.value as PositionValue).index);
    }

    expect(indices).toEqual([0, 1, 2]);
  });
});
