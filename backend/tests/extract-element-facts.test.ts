import { describe, expect, it, vi } from "vitest";
import type { ElementHandle } from "playwright";
import { extractElementFacts } from "../src/execution/extractElementFacts.js";

interface MockElementOptions {
  attributes?: Record<string, string | null>;
  text?: string | null;
  tag?: string;
}

function createMockElement({
  attributes = {},
  text = null,
  tag = "div",
}: MockElementOptions) {
  return {
    getAttribute: vi.fn(async (name: string) => attributes[name] ?? null),
    textContent: vi.fn(async () => text),
    evaluate: vi.fn(async () => tag),
  };
}

describe("extractElementFacts", () => {
  it("extracts every fact when the element has id, name, data-testid, class, tag, and text", async () => {
    const element = createMockElement({
      attributes: {
        id: "submit-btn",
        name: "submit",
        "data-testid": "submit-button",
        class: "primary Button___34wHC large",
      },
      text: "Submit",
      tag: "button",
    });

    const facts = await extractElementFacts(
      element as unknown as ElementHandle,
    );

    expect(facts).toEqual({
      id: "submit-btn",
      name: "submit",
      testId: "submit-button",
      text: "Submit",
      tag: "button",
      classList: ["primary", "Button___34wHC", "large"],
      classPrefix: "Button",
    });
  });

  it("finds the hash-suffixed class wherever it sits in the class list, not just the first one", async () => {
    const element = createMockElement({
      attributes: {
        class: "layout-row Card___9fXq2 is-active",
      },
      text: null,
      tag: "div",
    });

    const facts = await extractElementFacts(
      element as unknown as ElementHandle,
    );

    expect(facts.classPrefix).toBe("Card");
  });

  it("returns a null classPrefix when no class in the list has a hash suffix", async () => {
    const element = createMockElement({
      attributes: {
        class: "layout-row is-active primary",
      },
      text: null,
      tag: "div",
    });

    const facts = await extractElementFacts(
      element as unknown as ElementHandle,
    );

    expect(facts.classList).toEqual(["layout-row", "is-active", "primary"]);
    expect(facts.classPrefix).toBeNull();
  });

  it("returns null/undefined for facts that are absent, instead of empty strings", async () => {
    const element = createMockElement({
      attributes: {},
      text: "",
      tag: "div",
    });

    const facts = await extractElementFacts(
      element as unknown as ElementHandle,
    );

    expect(facts.id).toBeFalsy();
    expect(facts.name).toBeFalsy();
    expect(facts.testId).toBeFalsy();
    expect(facts.text).toBeFalsy();
    expect(facts.classList).toBeFalsy();
    expect(facts.classPrefix).toBeFalsy();
    expect(facts.tag).toBe("div");

    expect(facts.id).not.toBe("");
    expect(facts.name).not.toBe("");
    expect(facts.testId).not.toBe("");
    expect(facts.text).not.toBe("");
  });
});
