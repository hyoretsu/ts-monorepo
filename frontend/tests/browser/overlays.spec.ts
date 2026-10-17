import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
	await page.goto("/tests/browser/fixture.html", { waitUntil: "domcontentloaded" });
});
test("Back unwinds nested modals without moving the background", async ({ page }) => {
	const viewport = page.getByTestId("background").locator('[data-slot="scroll-area-viewport"]');
	await viewport.evaluate(element => {
		element.scrollTop = 300;
	});
	await page.getByRole("button", { exact: true, name: "Open parent" }).click();
	await page.getByRole("button", { exact: true, name: "Open child" }).click();
	await page.goBack();
	await expect(page.getByRole("heading", { name: "Child dialog" })).toBeHidden();
	await expect(page.getByRole("heading", { name: "Parent dialog" })).toBeVisible();
	await page.goBack();
	await expect(page.getByRole("heading", { name: "Parent dialog" })).toBeHidden();
	expect(await viewport.evaluate(element => element.scrollTop)).toBe(300);
});
test("special options survive search and calendar stays custom", async ({ page }) => {
	await page.getByRole("button", { exact: true, name: "Open parent" }).click();
	await page.getByRole("combobox").click();
	await page.getByPlaceholder("Search options").fill("unmatched");
	await expect(page.getByRole("option", { name: "No selection" })).toBeVisible();
	await expect(page.getByRole("option", { exact: true, name: "Alpha" })).toBeHidden();
	await page.getByRole("option", { name: "No selection" }).click();
	await page.getByRole("button", { exact: true, name: "Date" }).click();
	await expect(page.getByRole("grid")).toBeVisible();
	await expect(page.locator('input[type="date"]')).toHaveCount(0);
});
