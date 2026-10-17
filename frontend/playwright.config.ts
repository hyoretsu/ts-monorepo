import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
	fullyParallel: true,
	projects: [
		{ name: "desktop", use: { ...devices["Desktop Chrome"] } },
		{ name: "mobile", use: { ...devices["Pixel 7"] } },
	],
	testDir: "./tests/browser",
	timeout: 60000,
	use: {
		baseURL: "http://127.0.0.1:5189",
		launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH },
		trace: "retain-on-failure",
	},
	webServer: {
		command: "bunx vite --host 127.0.0.1 --port 5189 --strictPort",
		reuseExistingServer: false,
		url: "http://127.0.0.1:5189/tests/browser/fixture.html",
	},
	workers: 2,
});
