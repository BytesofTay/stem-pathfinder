import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

type School = { id: string; name: string; low_grade: string; high_grade: string };
const schools = vm.runInNewContext(fs.readFileSync(path.join(process.cwd(), "lausd_magnet_app/web/schools_data.js"), "utf8") + "\nSCHOOLS_DATA") as School[];
const academy = schools.find(school => school.name === "Science Academy STEM Magnet")!;
const sourceUrl = "https://scienceacademy.lausd.org/apps/pages/TSASchoolProfile";
const answer = (overrides = {}) => ({
  answer: "These reviewed options may fit your interests. Confirm admission requirements with the school.",
  citations: [{ id: "source-1", url: sourceUrl, title: "Official school program page", checkedAt: "2026-10-21" }],
  programs: [], actions: [], mode: "hosted-ai", ...overrides,
});
async function openChat(page: Page) {
  await page.goto("/");
  await page.locator("#chat-fab").click();
  await expect(page.locator("#chat-window")).toBeVisible();
}
async function ask(page: Page, question: string) {
  await page.locator("#chat-input").fill(question);
  await page.locator("#chat-send").click();
}

test("hosted answers stay plain text, cite official sources, and add a program idempotently", async ({ page }) => {
  await page.route("**/api/chat", route => route.fulfill({
    status: 200, contentType: "application/json", body: JSON.stringify(answer({
      answer: 'Reviewed answer <img src=x onerror="window.chatInjected=true"> [source-1]',
      citations: [
        { id: "source-1", url: sourceUrl, title: "Official <script>source</script>", checkedAt: "2026-10-21" },
        { id: "unsafe", url: "https://lausd.org.evil.test/trick", title: "Untrusted site", checkedAt: "2026-10-21" },
      ],
      programs: [{ programId: "academy", schoolId: academy.id, schoolName: academy.name, programName: "Science Academy program",
        description: "<script>window.chatInjected=true</script>", lowGrade: "6", highGrade: "12", interests: ["science"],
        sourceUrl, checkedAt: "2026-10-21" }],
    })),
  }));
  await openChat(page);
  await expect(page.locator("#chat-privacy")).toContainText("hosted AI");
  await ask(page, "Show science programs.");
  await expect(page.locator(".chat-answer").last()).toContainText("<img");
  await expect(page.locator(".chat-messages img, .chat-messages script")).toHaveCount(0);
  expect(await page.evaluate("window.chatInjected")).toBeUndefined();
  await expect(page.locator(".chat-sources li")).toHaveCount(1);
  await expect(page.locator(".chat-sources a")).toHaveAttribute("href", sourceUrl);
  await expect(page.locator(".chat-sources time")).toHaveText("Source checked 2026-10-21");
  await page.locator(".chat-add-school").click();
  await expect(page.locator(".chat-program-card .chat-action-result")).toContainText("Added to your comparison");
  await page.locator(".chat-add-school").click();
  await expect(page.locator(".chat-program-card .chat-action-result")).toContainText("Already in your comparison");
  await page.locator('[data-chat-close="minimize"]').click();
  await page.locator(".hero-browse-link").click();
  await page.locator("#tab-saved").click();
  await expect(page.locator(".comparison-card h3")).toHaveText([academy.name]);
});

test("hosted add actions keep existing schools, reject invented IDs, and enforce the three-school cap", async ({ page }) => {
  const chosen = schools.slice(0, 4);
  await page.addInitScript(name => localStorage.setItem("stem_pathfinder_compare", JSON.stringify([name])), chosen[0].name);
  const requests: Array<{ comparisonSchoolIds: string[] }> = [];
  await page.route("**/api/chat", route => {
    requests.push(route.request().postDataJSON());
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(answer({
      actions: [{ type: "add_to_comparison", schoolIds: [...chosen.map(school => school.id), "99999999999999"] }],
    })) });
  });
  await openChat(page);
  await ask(page, "Add these schools to my comparison.");
  await expect(page.locator(".chat-model-action")).toContainText("Added to your comparison");
  await expect(page.locator(".chat-model-action")).toContainText("Already in your comparison");
  await expect(page.locator(".chat-model-action")).toContainText("up to three");
  await expect(page.locator(".chat-model-action")).toContainText("was not added");
  expect(requests[0].comparisonSchoolIds).toEqual([chosen[0].id]);
  await ask(page, "Add those schools again.");
  await expect(page.locator(".chat-model-action").last()).toContainText("Already in your comparison");
  expect(requests[1].comparisonSchoolIds.sort()).toEqual(chosen.slice(0, 3).map(school => school.id).sort());
  await page.locator('[data-chat-close="close"]').click();
  await page.locator(".hero-browse-link").click();
  await page.locator("#tab-saved").click();
  await expect(page.locator(".comparison-card h3")).toHaveCount(3);
  expect((await page.locator(".comparison-card h3").allTextContents()).sort()).toEqual(chosen.slice(0, 3).map(school => school.name).sort());
});

test("rate limits show an honest error and retry the same question without duplicating the transcript", async ({ page }) => {
  const requests: Array<{ messages: Array<{ role: string; content: string }> }> = [];
  await page.route("**/api/chat", route => {
    requests.push(route.request().postDataJSON());
    return route.fulfill({ status: requests.length === 1 ? 429 : 200, contentType: "application/json",
      body: JSON.stringify(requests.length === 1 ? { error: { code: "RATE_LIMITED", message: "Limit reached" }, retryAfterSeconds: 1 } : answer()) });
  });
  await openChat(page);
  await ask(page, "What should I check before applying?");
  await expect(page.locator("#chat-error")).toContainText("request limit");
  await expect(page.locator("#chat-retry")).toBeEnabled();
  await page.locator("#chat-retry").click();
  await expect(page.locator(".chat-sources")).toBeVisible();
  await expect(page.locator("#chat-error")).toBeHidden();
  await expect(page.locator(".msg.user")).toHaveCount(1);
  expect(requests[1].messages).toEqual(requests[0].messages);
});

test("unconfigured hosted AI is explicit and the school finder remains usable", async ({ page }) => {
  await page.route("**/api/chat", route => route.fulfill({ status: 503, contentType: "application/json",
    body: JSON.stringify({ error: { code: "NOT_CONFIGURED", message: "No provider credential" } }) }));
  await openChat(page);
  await ask(page, "Find schools for grade 9.");
  await expect(page.locator("#chat-error")).toContainText("Hosted AI is not configured");
  await expect(page.locator("#chat-retry")).toHaveCount(0);
  await expect(page.locator(".chat-program-card")).toHaveCount(0);
  await page.locator('[data-chat-close="close"]').click();
  await page.locator(".btn-start").click();
  await expect(page.locator("#quiz-body .opt")).toHaveCount(13);
});

test("platform HTML rate limits honor Retry-After and malformed successful responses stay errors", async ({ page }) => {
  let attempts = 0;
  await page.route("**/api/chat", route => {
    attempts++;
    return route.fulfill({ status: attempts === 1 ? 429 : 200, contentType: "text/html",
      headers: attempts === 1 ? { "Retry-After": "2" } : {},
      body: attempts === 1 ? "<h1>Too many requests</h1>" : "<h1>Unexpected platform response</h1>" });
  });
  await openChat(page);
  await ask(page, "What are the application dates?");
  await expect(page.locator("#chat-error")).toContainText("request limit");
  await expect(page.locator("#chat-retry")).toBeDisabled();
  await expect(page.locator("#chat-retry")).toBeEnabled();
  await page.locator("#chat-retry").click();
  await expect(page.locator("#chat-error")).toContainText("could not answer");
  await expect(page.locator(".chat-program-card, .chat-sources")).toHaveCount(0);
  await expect(page.locator(".msg.user")).toHaveCount(1);
});

test("Spanish mobile chat sends bounded memory-only history and keeps sources readable", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const requests: Array<{ language: string; messages: Array<{ role: string; content: string }> }> = [];
  await page.route("**/api/chat", route => {
    requests.push(route.request().postDataJSON());
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(answer({
      answer: "Consulte los requisitos del programa en la fuente oficial. ".repeat(40),
      programs: [{ programId: "academy", schoolId: academy.id, schoolName: academy.name, programName: "Science Academy program",
        description: "English description", descriptionEs: "Descripción del programa revisado en español.",
        eligibilityNote: "English requirement", eligibilityNoteEs: "Requisito de ingreso revisado.",
        locationNote: "English location", locationNoteEs: "Ubicación revisada.",
        lowGrade: "6", highGrade: "12", interests: ["science"], sourceUrl, checkedAt: "2026-10-21" }],
    })) });
  });
  await page.goto("/");
  await page.locator("#lang-toggle").click();
  await page.locator("#chat-fab").click();
  await expect(page.locator("#chat-privacy")).toContainText("servicio de IA");
  await page.locator("#chat-qr .qr-btn").first().click();
  await expect(page.locator(".chat-sources")).toBeVisible();
  for (let index = 0; index < 4; index++) {
    await ask(page, "Pregunta de seguimiento " + index);
    await expect(page.locator(".chat-sources")).toHaveCount(index + 2);
  }
  expect(requests.every(request => request.language === "es" && request.messages.length <= 8 &&
    request.messages.every(message => message.content.length <= 1200) &&
    request.messages.reduce((sum, message) => sum + message.content.length, 0) <= 6000)).toBe(true);
  expect(requests.at(-1)!.messages[0].role).toBe("user");
  expect(requests.at(-1)!.messages.at(-1)!.role).toBe("user");
  await expect(page.locator(".chat-sources time").last()).toHaveText("Fuente consultada el 2026-10-21");
  await expect(page.locator(".chat-program-card").last()).toContainText("Descripción del programa revisado en español.");
  await expect(page.locator(".chat-program-card").last()).toContainText("Requisito de ingreso revisado.");
  await expect(page.locator(".chat-program-card").last()).not.toContainText("English description");
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const panel = await page.locator("#chat-window").boundingBox();
  expect(panel!.width).toBeLessThanOrEqual(375);
  expect(await page.evaluate(() => Object.keys(localStorage).filter(key => /chat|conversation|transcript/i.test(key)))).toEqual([]);
  await page.locator("#chat-new").click();
  await expect(page.locator(".msg.user")).toHaveCount(0);
  await expect(page.locator("#chat-qr")).toBeVisible();
  await page.reload();
  await page.locator("#chat-fab").click();
  await expect(page.locator(".msg.user")).toHaveCount(0);
});
