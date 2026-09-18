import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it, vi, afterEach } from "vitest";
import supertest from "supertest";
import { chromium } from "playwright";
import { buildServer } from "../src/app.js";
import { resolveCandidates } from "../src/execution/resolveCandidates.js";

// resolveCandidates (VFN-31/32/33) already has its own thorough unit tests.
// Here we only care that /scan discovers and categorizes real elements on a
// real page, and wires each one's ranked candidates into the response --
// not that the ranking algorithm itself is correct -- so it's stubbed with
// a fixed, easy-to-assert-on result.
vi.mock("../src/execution/resolveCandidates.js", () => ({
  resolveCandidates: vi.fn(),
}));

const FIXED_CANDIDATES = [{ type: "testId", value: "stub", score: 100 }];

const fixtureUrl = `file://${path
  .join(path.dirname(fileURLToPath(import.meta.url)), "fixtures", "scan-fixture.html")
  .replace(/\\/g, "/")}`;

describe("POST /scan", () => {
  afterEach(() => {
    vi.mocked(resolveCandidates).mockReset();
  });

  it("categorizes only genuinely interactive elements (input, button, a, select), excluding generic text like <p>", async () => {
    vi.mocked(resolveCandidates).mockResolvedValue(FIXED_CANDIDATES as never);

    const app = buildServer();
    await app.ready();

    const response = await supertest(app.server)
      .post("/scan")
      .send({ url: fixtureUrl });

    await app.close();

    expect(response.status).toBe(200);
    expect(response.body.url).toBe(fixtureUrl);

    const { elements } = response.body;
    expect(elements).toEqual({
      input: [{ tag: "input", candidates: FIXED_CANDIDATES }],
      button: [{ tag: "button", candidates: FIXED_CANDIDATES }],
      link: [{ tag: "a", candidates: FIXED_CANDIDATES }],
      select: [{ tag: "select", candidates: FIXED_CANDIDATES }],
    });

    // The fixture's <p> must never reach the ranking pipeline: exactly one
    // call per interactive element (input, button, a, select), not five.
    expect(resolveCandidates).toHaveBeenCalledTimes(4);
  });

  it("sorts each element's candidates descending by score before returning them", async () => {
    // Mirrors a real reported bug: resolveCandidates' internal picks
    // (getBestCandidate) are order-independent and correct, but the raw
    // array handed back -- and therefore the API response -- was never
    // actually sorted, so a real scan showed scores like 43, 50, 30, 50,
    // 50, 50 for one button, out of order.
    const unsortedCandidates = [
      { type: "text", value: "Login", score: 43 },
      { type: "class", value: "btn", score: 50 },
      { type: "position", value: { tag: "button", index: 0 }, score: 30 },
      { type: "compound", value: { parent: {}, child: {} }, score: 50 },
      { type: "compound", value: { parent: {}, child: {} }, score: 50 },
      { type: "compound", value: { parent: {}, child: {} }, score: 50 },
    ];
    vi.mocked(resolveCandidates).mockResolvedValue(unsortedCandidates as never);

    const app = buildServer();
    await app.ready();

    const response = await supertest(app.server)
      .post("/scan")
      .send({ url: fixtureUrl });

    await app.close();

    const scores = response.body.elements.button[0].candidates.map(
      (c: { score: number }) => c.score,
    );
    expect(scores).toEqual([50, 50, 50, 50, 43, 30]);
  });

  // Spies on the real chromium.launch, but still lets it launch a real
  // browser -- it just also spies on that browser's own close() method, so
  // we can assert close was called without racing Playwright's internal
  // "disconnected" state, which settles slightly after close() resolves.
  function spyOnRealBrowserClose() {
    const originalLaunch = chromium.launch.bind(chromium);
    return vi.spyOn(chromium, "launch").mockImplementation(async (options) => {
      const browser = await originalLaunch(options);
      vi.spyOn(browser, "close");
      return browser;
    });
  }

  it("always closes the browser after a scan, even when it succeeds", async () => {
    vi.mocked(resolveCandidates).mockResolvedValue(FIXED_CANDIDATES as never);
    const launchSpy = spyOnRealBrowserClose();

    const app = buildServer();
    await app.ready();

    await supertest(app.server).post("/scan").send({ url: fixtureUrl });
    await app.close();

    const launchedBrowser = await launchSpy.mock.results[0]?.value;
    expect(launchedBrowser.close).toHaveBeenCalled();

    launchSpy.mockRestore();
  });

  it("returns a clear error, and still closes the browser, when the URL fails to load", async () => {
    const launchSpy = spyOnRealBrowserClose();

    const app = buildServer();
    await app.ready();

    const response = await supertest(app.server)
      .post("/scan")
      .send({ url: "not-a-valid-url" });

    await app.close();

    expect(response.status).toBe(400);
    expect(response.body.error).toEqual(expect.any(String));
    expect(resolveCandidates).not.toHaveBeenCalled();

    const launchedBrowser = await launchSpy.mock.results[0]?.value;
    expect(launchedBrowser.close).toHaveBeenCalled();

    launchSpy.mockRestore();
  });
});
