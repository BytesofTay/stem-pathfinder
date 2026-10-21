import { expect, test, type Page } from "@playwright/test";

async function findSchools(page: Page, grade = "9", interest = "science") {
  await page.goto("/");
  await page.locator(".btn-start").click();
  await expect(page.locator("#step-label")).toHaveText("Step 1 of 2");
  await expect(page.locator("#quiz-body .opt")).toHaveCount(13);
  await page.locator('.opt[data-v="' + grade + '"]').click();
  await page.locator("#btn-next").click();
  await expect(page.locator("#step-label")).toHaveText("Step 2 of 2");
  await page.locator('.opt[data-v="' + interest + '"]').click();
  await page.locator("#btn-next").click();
  await expect(page.locator("#results-panel")).toBeVisible();
}

async function browseSchools(page: Page) {
  await page.goto("/");
  await page.locator(".hero-browse-link").click();
  await expect(page.locator("#list-panel .card").first()).toBeVisible();
}

test("two-step exact-grade matches show sourced facts and survive a shared-result reload", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await findSchools(page);
  await expect(page).toHaveURL(/#results\/9\/science\/match$/);
  await expect(page.locator("#results-list .rcard").first()).toBeVisible();
  await expect(page.locator("#results-list .program-evidence").first()).toBeVisible();
  await expect(page.locator("#results-list .program-evidence a").first()).toHaveAttribute("href", /^https:\/\/.*(?:lausd|lausdschool|schoolloop|nhszoo)/);
  await expect(page.locator("#results-list .score-row, #results-list .overall")).toHaveCount(0);
  const firstSchool = await page.locator(".rcard-name").first().innerText();
  await page.locator('[onclick="shareResults()"]').click();
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
  expect(sharedUrl).toMatch(/#results\/9\/science\/match$/);
  await page.goto(sharedUrl);
  await expect(page.locator(".rcard-name").first()).toHaveText(firstSchool);
  await expect(page.locator("#results-sub")).toContainText("Grade 9");
});

test("saved-school UI writes to the API and restores after browser storage is cleared", async ({ page, context, browser }) => {
  await findSchools(page, "K", "any");
  const name = await page.locator(".rcard-name").first().innerText();
  const write = page.waitForResponse(response => response.url().endsWith("/api/favorites") && response.request().method() === "PUT");
  await page.locator(".rcard .fav-btn").first().click();
  expect((await write).ok()).toBe(true);
  const stored = await context.request.get("/api/favorites");
  expect((await stored.json()).favorites).toContain(name);
  await page.evaluate(() => {
    localStorage.removeItem("lausd_favorites");
    localStorage.removeItem("lausd_favorites_pending_sync");
  });
  await page.reload();
  await page.locator(".results-footer .link-btn").click();
  await page.locator("#tab-saved").click();
  await expect(page.locator("#saved-panel .card-name")).toHaveText([name]);
  const isolated = await browser.newContext();
  try {
    const otherVisitor = await isolated.request.get(new URL("/api/favorites", page.url()).href);
    expect((await otherVisitor.json()).favorites).toEqual([]);
  } finally {
    await isolated.close();
  }
});

test("comparison enforces three schools and shares a restorable shortlist with a fresh visitor", async ({ page, context, browser }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await browseSchools(page);
  const cards = page.locator("#list-content .card");
  const expectedNames = await cards.locator(".card-name").evaluateAll(elements => elements.slice(0, 3).map(element => element.textContent || ""));
  for (let index = 0; index < 3; index++) await cards.nth(index).locator(".compare-btn").click();
  await cards.nth(3).locator(".compare-btn").click();
  await expect(page.locator(".toast")).toContainText("up to three");
  await expect(cards.nth(3).locator(".compare-btn")).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator('#list-content .compare-btn[aria-pressed="true"]')).toHaveCount(3);
  await page.locator("#tab-saved").click();
  await expect(page.locator(".comparison-card")).toHaveCount(3);
  await page.locator('[data-action="share-shortlist"]').click();
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
  expect(sharedUrl).toContain("#shortlist/");
  const recipient = await browser.newContext();
  try {
    const recipientPage = await recipient.newPage();
    await recipientPage.goto(sharedUrl);
    await expect(recipientPage.locator(".comparison-card h3")).toHaveCount(3);
    expect((await recipientPage.locator(".comparison-card h3").allTextContents()).sort()).toEqual([...expectedNames].sort());
    await recipientPage.reload();
    await expect(recipientPage.locator(".comparison-card h3")).toHaveCount(3);
    expect((await recipientPage.locator(".comparison-card h3").allTextContents()).sort()).toEqual([...expectedNames].sort());
    await expect(recipientPage.locator("#tab-saved")).toHaveAttribute("aria-selected", "true");
    const removedName = await recipientPage.locator(".comparison-card h3").first().innerText();
    await recipientPage.locator('.comparison-card [data-action="compare"]').first().click();
    const remainingNames = expectedNames.filter(name => name !== removedName);
    await expect(recipientPage.locator(".comparison-card")).toHaveCount(2);
    await recipientPage.reload();
    await expect(recipientPage.locator(".comparison-card h3")).toHaveCount(2);
    expect((await recipientPage.locator(".comparison-card h3").allTextContents()).sort()).toEqual([...remainingNames].sort());
    await recipientPage.locator("#tab-list").click();
    const additionalCard = recipientPage.locator("#list-content .card").nth(3);
    const additionalName = await additionalCard.locator(".card-name").innerText();
    await additionalCard.locator(".compare-btn").click();
    await recipientPage.reload();
    await expect(recipientPage.locator(".comparison-card h3")).toHaveCount(3);
    expect((await recipientPage.locator(".comparison-card h3").allTextContents()).sort()).toEqual([...remainingNames, additionalName].sort());
  } finally {
    await recipient.close();
  }
});

test("reopened map pins show the current saved and comparison states", async ({ page }) => {
  await browseSchools(page);
  await page.locator("#tab-map").click();
  const pin = page.locator("#school-map path.leaflet-interactive").first();
  await expect(pin).toBeVisible();
  /* Target this pin's DOM event directly: neighboring campus markers can overlap. */
  const openPin = async () => {
    const bounds = await pin.boundingBox();
    if (!bounds) throw new Error("Expected a visible school pin");
    await pin.dispatchEvent("click", { bubbles: true, clientX: bounds.x + bounds.width / 2, clientY: bounds.y + bounds.height / 2 });
  };
  await openPin();
  const popup = page.locator(".leaflet-popup");
  await expect(popup).toBeVisible();
  const school = await popup.locator(".map-popup-name").innerText();
  await popup.locator('[data-action="favorite"]').click();
  await popup.locator('[data-action="compare"]').click();
  await popup.locator(".leaflet-popup-close-button").press("Enter");
  await expect(popup).toHaveCount(0);
  await openPin();
  await expect(popup).toHaveCount(1);
  await expect(popup.locator(".map-popup-name")).toHaveText(school);
  await expect(popup.locator('[data-action="favorite"]')).toHaveAttribute("aria-pressed", "true");
  await expect(popup.locator('[data-action="compare"]')).toHaveAttribute("aria-pressed", "true");
});

test("directory uses actual grade ranges and exposes dated official program evidence", async ({ page }) => {
  await browseSchools(page);
  await expect(page.locator("#source-freshness")).toContainText(/20\d{2}-\d{2}-\d{2}/);
  await expect(page.getByRole("link", { name: "CDE school data", exact: true })).toHaveAttribute("href", /^https:\/\//);
  await page.locator("#search").fill("Lake Balboa College Preparatory");
  await page.locator("#grade-filter").selectOption("9");
  await expect(page.locator("#list-content .card")).toHaveCount(1);
  await expect(page.locator("#list-content")).toContainText("Campus grades K–12");
  await page.locator("#search").fill("Sherman Oaks Center");
  await page.locator("#grade-filter").selectOption("K");
  await expect(page.locator("#list-content .card")).toHaveCount(0);
  await page.locator("#grade-filter").selectOption("4");
  await expect(page.locator("#list-content")).toContainText("Campus grades 4–12");
  await page.locator("#search").fill("Science Academy STEM");
  await page.locator("#grade-filter").selectOption("9");
  const evidence = page.locator("#list-content .program-evidence").first();
  await expect(evidence).toBeVisible();
  await expect(evidence.locator("a").first()).toHaveAttribute("href", /^https:\/\//);
  await expect(evidence).toContainText(/Source checked \d{4}-\d{2}-\d{2}/);
  await expect(page.locator("#list-content .score-row, #list-content .overall")).toHaveCount(0);
});

test("application guide gives the sourced 2027–28 calendar and preserves a local checklist", async ({ page }) => {
  await page.goto("/");
  const guide = page.locator("#application-guide");
  await page.locator("#deadline-link").click();
  await expect(guide).toBeInViewport();
  await expect(guide).toContainText("2027–28");
  await expect(guide).toContainText("October 1–November 6, 2026");
  await expect(guide).toContainText("December 1, 2026");
  await expect(guide.getByRole("link", { name: "LAUSD enrollment calendar" })).toHaveAttribute("href", /^https:\/\/www\.lausd\.org\//);
  await expect(guide.locator(".guide-apply")).toHaveAttribute("href", "https://apply.lausd.net");
  await guide.locator('[data-checklist-step="1"]').check();
  await page.reload();
  await expect(guide.locator('[data-checklist-step="1"]')).toBeChecked();
  await expect(guide.locator('[data-checklist-step="2"]')).not.toBeChecked();
});

test("Spanish finder works with keyboard controls on a 375-pixel phone layout", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await page.locator("#lang-toggle").click();
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await page.locator(".btn-start").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#step-label")).toHaveText("Paso 1 de 2");
  const grade = page.locator('.opt[data-v="9"]');
  await grade.focus();
  await page.keyboard.press("Space");
  await expect(grade).toHaveAttribute("aria-pressed", "true");
  await expect(grade).toBeFocused();
  await page.locator("#btn-next").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#step-label")).toHaveText("Paso 2 de 2");
  await page.locator('.opt[data-v="medical"]').focus();
  await page.keyboard.press("Enter");
  await page.locator("#btn-next").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#results-sub")).toContainText("Grado 9");
  await expect(page.locator("#results-sub")).toContainText("Medicina");
  await expect(page.locator(".rcard").first()).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.locator(".results-footer .link-btn").click();
  await page.locator("#tab-saved").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#tab-saved")).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#tab-list")).toHaveAttribute("aria-selected", "false");
  await expect(page.locator("#comparison-panel")).toContainText("comparación");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
});
