import { expect, test } from "@playwright/test";

test("quiz, share link, saved school, and reload work end to end", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  await expect(page.locator("#source-freshness")).toContainText("2026-07-06");
  await expect(page.getByRole("link", { name: "CDE school data" })).toBeVisible();
  await page.getByRole("button", { name: "Get Started" }).click();
  await page.locator('.opt[data-v="elem"]').click();
  await page.getByRole("button", { name: "Next step" }).click();
  await page.locator('.opt[data-v="tech"]').click();
  await page.getByRole("button", { name: "Next step" }).click();
  await page.locator('.opt[data-v="quality"]').click();
  await page.getByRole("button", { name: "Next step" }).click();

  await expect(page.locator("#results-panel")).toBeVisible();
  await expect(page.locator(".rcard").first()).toBeVisible();
  await expect(page).toHaveURL(/#results\/elem\/tech\/quality$/);
  await page.screenshot({ path: "docs/screenshots/quiz-results.png", fullPage: true });

  await page.getByRole("button", { name: "Share these results" }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain("#results/elem/tech/quality");

  const firstSchoolName = await page.locator(".rcard-name").first().textContent();
  await page.locator(".rcard .fav-btn").first().click();
  await page.getByRole("button", { name: "Browse all 180 schools", exact: true }).click();
  await page.getByRole("tab", { name: /Saved/ }).click();
  await expect(page.locator("#saved-panel")).toContainText(firstSchoolName!);

  await page.reload();
  await page.getByRole("button", { name: "Browse all 180 schools", exact: true }).click();
  await page.getByRole("tab", { name: /Saved/ }).click();
  await expect(page.locator("#saved-panel")).toContainText(firstSchoolName!);
});
