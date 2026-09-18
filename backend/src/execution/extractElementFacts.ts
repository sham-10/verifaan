import type { ElementHandle } from "playwright";

export interface ElementFacts {
  id: string | null;
  name: string | null;
  testId: string | null;
  text: string | null;
  tag: string;
  classList: string[] | null;
  classPrefix: string | null;
}

// CSS-module build hashes look like "Button___34wHC": three underscores
// followed by a short alphanumeric hash. Matching it lets us recover a
// stable prefix even when the hash changes between builds.
const HASH_SUFFIX_PATTERN = /___[A-Za-z0-9]{4,10}$/;

export async function extractElementFacts(
  element: ElementHandle,
): Promise<ElementFacts> {
  const [id, name, testId, classAttribute, tag, rawText] = await Promise.all([
    element.getAttribute("id"),
    element.getAttribute("name"),
    element.getAttribute("data-testid"),
    element.getAttribute("class"),
    element.evaluate((el) => (el as Element).tagName.toLowerCase()),
    element.textContent(),
  ]);

  const classList = parseClassList(classAttribute);

  return {
    id,
    name,
    testId,
    text: normalizeText(rawText),
    tag,
    classList,
    classPrefix: findClassPrefix(classList),
  };
}

function parseClassList(classAttribute: string | null): string[] | null {
  const classes = classAttribute?.trim().split(/\s+/).filter(Boolean) ?? [];
  return classes.length > 0 ? classes : null;
}

function normalizeText(text: string | null): string | null {
  const trimmed = text?.trim();
  return trimmed ? trimmed : null;
}

function findClassPrefix(classList: string[] | null): string | null {
  const hashedClass = classList?.find((className) =>
    HASH_SUFFIX_PATTERN.test(className),
  );
  return hashedClass ? hashedClass.replace(HASH_SUFFIX_PATTERN, "") : null;
}
