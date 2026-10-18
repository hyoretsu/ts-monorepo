import { test } from "bun:test";
import { strict as assert } from "node:assert";
import { access, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { prepareVariant, resolveVariant, type VariantBranding } from "../prepare-variant";

test("disposable branding switching", async () => {
	// Disposable local integration scenario. No shared database or remote assets.
	const server = Bun.serve({
		fetch: request =>
			new URL(request.url).pathname === "/mobile"
				? new Response(Bun.file(new URL("../../branding/defaults/icons/icon.png", import.meta.url)), {
						headers: { "Content-Type": "image/png" },
					})
				: new Response("font-fixture"),
		hostname: "127.0.0.1",
		port: 0,
	});
	const base: VariantBranding = {
		allowThemeToggle: false,
		apiUrl: "http://localhost:3334",
		defaultTheme: "dark",
		fontFamily: "Test Font",
		fontUrl: `${server.url}font`,
		footerText: "Alpha footer",
		logoUrl: null,
		mobileIconUrl: `${server.url}mobile`,
		name: "Alpha",
		nativePackageId: "com.example.alpha",
		siteUrl: "http://localhost:5174",
		slug: "alpha",
		themeColors: { dark: { primary: "#abcdef" }, light: { primary: "#123456" } },
	};
	try {
		for (const value of ["", " ", "\n"]) assert.equal(await resolveVariant(value), null);
		await prepareVariant(base);
		assert.match(
			await readFile(new URL("../../frontend/src/lib/branding.ts", import.meta.url), "utf8"),
			/Alpha footer/,
		);
		assert.match(
			await readFile(new URL("../../frontend/src-tauri/tauri.conf.json", import.meta.url), "utf8"),
			/com.example.alpha/,
		);
		await mkdir(new URL("../../frontend/public/.well-known", import.meta.url), { recursive: true });
		await writeFile(
			new URL("../../frontend/public/.well-known/assetlinks.json", import.meta.url),
			"stale alpha links",
		);
		await writeFile(
			new URL("../../frontend/src-tauri/tauri.links.conf.json", import.meta.url),
			"stale alpha config",
		);
		await prepareVariant({
			...base,
			fontFamily: null,
			fontUrl: null,
			mobileIconUrl: null,
			name: "Beta",
			nativePackageId: null,
			slug: "beta",
			themeColors: null,
		});
		await assert.rejects(
			access(new URL("../../frontend/public/.well-known/assetlinks.json", import.meta.url)),
		);
		await assert.rejects(
			access(new URL("../../frontend/src-tauri/tauri.links.conf.json", import.meta.url)),
		);
		assert.deepEqual(await readdir(new URL("../../frontend/public/branding", import.meta.url)), [
			"theme.css",
		]);
		const before = await readFile(new URL("../../frontend/index.html", import.meta.url), "utf8");
		await assert.rejects(prepareVariant({ ...base, apiUrl: "file:///bad" }));
		assert.equal(await readFile(new URL("../../frontend/index.html", import.meta.url), "utf8"), before);
		await prepareVariant(null);
		assert.doesNotMatch(
			await readFile(new URL("../../frontend/index.html", import.meta.url), "utf8"),
			/Alpha|Beta/,
		);
		assert.doesNotMatch(
			await readFile(new URL("../../frontend/src-tauri/tauri.conf.json", import.meta.url), "utf8"),
			/com.example.alpha/,
		);
		assert.deepEqual(await readdir(new URL("../../frontend/public/branding", import.meta.url)), [
			"theme.css",
		]);
		console.info(
			"Branding integration: blank selection, A → B → defaults, stale font cleanup, failed validation preservation passed.",
		);
	} finally {
		server.stop(true);
		await prepareVariant(null);
	}
}, 60000);
