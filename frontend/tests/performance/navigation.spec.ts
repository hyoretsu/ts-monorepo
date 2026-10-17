import { expect, test } from "@playwright/test";

test("fixture navigation records external browser timings", async ({ page }, info) => {
	await page.goto("/tests/browser/fixture.html", { waitUntil: "domcontentloaded" });
	await expect(page.getByRole("heading", { name: "UI fixture" })).toBeVisible();
	const timing = await page.evaluate(() =>
		performance.getEntriesByType("navigation").map(entry => entry.toJSON()),
	);
	await info.attach("navigation.json", { body: JSON.stringify(timing), contentType: "application/json" });
});
