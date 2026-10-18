import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { branding } from "../src/lib/branding";

const root = resolve(import.meta.dir, "..");
const strict = process.argv.includes("--strict");
const appUrl = branding.siteUrl ?? process.env.VITE_APP_URL;
const nativeConfig = await Bun.file(resolve(root, "src-tauri/tauri.conf.json")).json();
const appId = branding.slug ? nativeConfig.identifier : process.env.APP_IDENTIFIER;
const teamId = process.env.APPLE_TEAM_ID;
const fingerprints = process.env.ANDROID_SHA256_FINGERPRINTS?.split(",")
	.map(value => value.trim())
	.filter(Boolean);
if (!appUrl || !appId || !teamId || !fingerprints?.length) {
	if (strict)
		throw new Error("Set VITE_APP_URL, APP_IDENTIFIER, APPLE_TEAM_ID and ANDROID_SHA256_FINGERPRINTS.");
	console.info("Associated links skipped: identifiers not configured.");
	process.exit(0);
}
const url = new URL(appUrl);
if (url.protocol !== "https:") throw new Error("Associated links require HTTPS.");
if (
	!/^[A-Za-z0-9]+$/.test(teamId) ||
	!/^([A-Za-z][A-Za-z0-9_]*\.)+[A-Za-z][A-Za-z0-9_]*$/.test(appId) ||
	fingerprints.some(value => !/^([0-9A-Fa-f]{2}:){31}[0-9A-Fa-f]{2}$/.test(value))
)
	throw new Error("Invalid application identifiers or certificate fingerprints.");
const directory = resolve(root, "public/.well-known");
await mkdir(directory, { recursive: true });
await writeFile(
	resolve(directory, "assetlinks.json"),
	JSON.stringify(
		[
			{
				relation: ["delegate_permission/common.handle_all_urls"],
				target: { namespace: "android_app", package_name: appId, sha256_cert_fingerprints: fingerprints },
			},
		],
		null,
		2,
	),
);
await writeFile(
	resolve(directory, "apple-app-site-association"),
	JSON.stringify(
		{
			applinks: {
				apps: [],
				details: [{ appID: `${teamId}.${appId}`, paths: ["/auth/reset-password*", "/auth/verify-email*"] }],
			},
		},
		null,
		2,
	),
);
await writeFile(
	resolve(root, "src-tauri/tauri.links.conf.json"),
	JSON.stringify(
		{
			identifier: appId,
			plugins: {
				"deep-link": {
					desktop: { schemes: [process.env.VITE_APP_SCHEME ?? "template"] },
					mobile: [
						{
							host: url.hostname,
							pathPrefix: ["/auth/reset-password", "/auth/verify-email"],
							scheme: ["https"],
						},
					],
				},
			},
		},
		null,
		2,
	),
);
