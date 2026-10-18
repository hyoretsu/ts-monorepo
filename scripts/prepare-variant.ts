import { cp, mkdir, mkdtemp, readFile, rename, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const defaults = join(root, "branding/defaults");
const slug = process.env.VARIANT?.trim() || "";
export interface VariantBranding {
	slug: string;
	name: string;
	apiUrl: string | null;
	siteUrl: string | null;
	logoUrl: string | null;
	mobileIconUrl: string | null;
	fontFamily: string | null;
	fontUrl: string | null;
	footerText: string | null;
	nativePackageId: string | null;
	defaultTheme: string | null;
	allowThemeToggle: boolean | null;
	themeColors: unknown;
}
export async function resolveVariant(selection: string): Promise<VariantBranding | null> {
	const selected = selection.trim();
	if (!selected) return null;
	if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(selected)) throw new Error(`Invalid VARIANT slug: ${selected}`);
	const { PrismaClient, adapter } = await import("../packages/sql/src/index");
	const prisma = new PrismaClient({ adapter });
	try {
		const variant = await prisma.variant.findUnique({ where: { slug: selected } });
		if (!variant) throw new Error(`Unknown VARIANT: ${selected}`);
		return variant;
	} finally {
		await prisma.$disconnect();
	}
}
function httpUrl(value: string | null | undefined) {
	if (!value) return null;
	const url = new URL(value);
	if (!["http:", "https:"].includes(url.protocol))
		throw new Error(`Branding URL must use HTTP(S): ${value}`);
	return url.href;
}
const escapeHtml = (value: string) =>
	value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
export async function prepareVariant(variant: VariantBranding | null) {
	// Stage all network and icon work before replacing any selected output.
	const stage = await mkdtemp(join(process.env.TMPDIR || tmpdir(), "template-branding-"));
	try {
		await cp(defaults, stage, { recursive: true });
		const assets = join(stage, "assets");
		await mkdir(assets);
		const name = variant?.name || "Template App";
		const apiUrl = httpUrl(variant?.apiUrl);
		const siteUrl = httpUrl(variant?.siteUrl);
		const fontFamily = variant?.fontFamily || null;
		if (fontFamily && !/^[\p{L}\p{N} _-]{1,100}$/u.test(fontFamily))
			throw new Error("Invalid branding font family");
		const colors = (variant?.themeColors || {}) as {
			light?: Record<string, string>;
			dark?: Record<string, string>;
		};
		const declarations = (values: Record<string, string> = {}) =>
			Object.entries(values)
				.map(([key, value]) => {
					if (
						!/^[a-z][a-zA-Z-]*$/.test(key) ||
						typeof value !== "string" ||
						!/^(#[\da-fA-F]{3,8}|(?:oklch|rgb|rgba|hsl|hsla)\([\d.% ,/+-]+\))$/.test(value)
					)
						throw new Error(`Invalid branding color: ${key}`);
					return `--${key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}:${value}`;
				})
				.join(";");
		const light = declarations(colors.light);
		const dark = declarations(colors.dark);
		if (variant?.defaultTheme && !["light", "dark", "system"].includes(variant.defaultTheme))
			throw new Error("Invalid branding theme preference");
		if (variant?.nativePackageId && !/^[a-zA-Z][\w]*(?:\.[a-zA-Z][\w]*)+$/.test(variant.nativePackageId))
			throw new Error("Invalid native package identifier");
		async function download(url: string | null, filename: string) {
			if (!url) return null;
			const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
			if (!response.ok) throw new Error(`Branding download failed (${response.status}): ${url}`);
			const bytes = await response.arrayBuffer();
			if (!bytes.byteLength) throw new Error(`Empty branding asset: ${url}`);
			const extension = response.headers.get("content-type")?.includes("svg")
				? ".svg"
				: filename === "font"
					? ".woff2"
					: ".png";
			await writeFile(join(assets, filename + extension), new Uint8Array(bytes));
			return `/branding/${filename}${extension}`;
		}
		const logo = await download(httpUrl(variant?.logoUrl), "logo");
		const mobile = await download(httpUrl(variant?.mobileIconUrl), "mobile-icon");
		const font = await download(httpUrl(variant?.fontUrl), "font");
		const css = `${font ? `@font-face{font-family:VariantFont;src:url('${font}');font-display:swap}` : ""}\n:root{${light};${font || fontFamily ? `--font-sans:${font ? "VariantFont" : JSON.stringify(fontFamily)},sans-serif` : ""}}\n:root.dark{${dark}}\n`;
		await writeFile(join(assets, "theme.css"), css);
		const conf = JSON.parse(await readFile(join(stage, "tauri.conf.json"), "utf8"));
		if (variant) {
			conf.productName = name;
			conf.app.windows[0].title = name;
			conf.identifier = variant.nativePackageId || conf.identifier;
		}
		if (mobile) {
			const result = Bun.spawnSync(
				[
					"bun",
					"x",
					"--no-install",
					"tauri",
					"icon",
					join(assets, mobile.split("/").at(-1)!),
					"--output",
					join(stage, "icons"),
				],
				{ cwd: join(root, "frontend"), stderr: "inherit", stdout: "inherit" },
			);
			if (result.exitCode)
				throw new Error("Could not generate variant native icons (use a square PNG or SVG)");
			await cp(join(stage, "icons/128x128.png"), join(assets, "favicon.png"));
		}
		let html = await readFile(join(stage, "index.html"), "utf8");
		if (variant) html = html.replace(/<title>.*?<\/title>/, `<title>${escapeHtml(name)}</title>`);
		html = html.replace("</head>", '<link rel="stylesheet" href="/branding/theme.css" /></head>');
		if (mobile)
			html = html.replace(
				'<link rel="icon" type="image/svg+xml" href="/vite.svg" />',
				'<link rel="icon" type="image/png" href="/branding/favicon.png" />',
			);
		const branding = {
			allowThemeToggle: variant?.allowThemeToggle ?? true,
			apiUrl,
			defaultTheme: variant?.defaultTheme || "dark",
			fontFamily,
			footerText: variant?.footerText || null,
			logoUrl: logo,
			name,
			siteUrl,
			slug: variant?.slug || null,
		};
		// Each write is atomic; no stale directory entries survive a selection change.
		async function replace(path: string, contents: string) {
			const target = join(root, path);
			await writeFile(`${target}.next`, contents);
			await rename(`${target}.next`, target);
		}
		const identity = JSON.stringify({
			identifier: conf.identifier,
			siteUrl,
			slug: variant?.slug || null,
		});
		const previousIdentity = await readFile(join(root, ".variant-prepared.json"), "utf8").catch(() => "");
		if (previousIdentity !== identity) {
			await rm(join(root, "frontend/public/.well-known"), { force: true, recursive: true });
			await rm(join(root, "frontend/src-tauri/tauri.links.conf.json"), { force: true });
		}
		await rm(join(root, "frontend/public/branding"), { force: true, recursive: true });
		await mkdir(join(root, "frontend/public"), { recursive: true });
		await cp(assets, join(root, "frontend/public/branding"), { recursive: true });
		await rm(join(root, "frontend/src-tauri/icons"), { force: true, recursive: true });
		await cp(join(stage, "icons"), join(root, "frontend/src-tauri/icons"), { recursive: true });
		await replace("frontend/index.html", html);
		await replace("frontend/src-tauri/tauri.conf.json", `${JSON.stringify(conf, null, "\t")}\n`);
		await replace(
			"frontend/src/lib/branding.ts",
			`// Generated by scripts/prepare-variant.ts.\nexport const branding = ${JSON.stringify(branding, null, "\t")} as {name:string;slug:string|null;apiUrl:string|null;siteUrl:string|null;logoUrl:string|null;fontFamily:string|null;footerText:string|null;defaultTheme:string;allowThemeToggle:boolean};\n`,
		);
		await replace(
			"backend/src/shared/infra/branding.ts",
			`// Generated by scripts/prepare-variant.ts.\nexport const emailBranding = ${JSON.stringify({ ...branding, colors: colors.light || {}, logoUrl: variant?.logoUrl || null }, null, "\t")} as {name:string;logoUrl:string|null;fontFamily:string|null;footerText:string|null;siteUrl:string|null;colors:Record<string,string>};\n`,
		);
		await replace(".variant-prepared.json", identity);
		console.log(`Prepared ${variant ? `variant ${variant.slug}` : "template defaults"}`);
	} finally {
		await rm(stage, { force: true, recursive: true });
	}
}
if (import.meta.main) {
	const lock = join(root, ".variant-prepare.lock");
	const deadline = Date.now() + 120000;
	while (true) {
		try {
			await mkdir(lock);
			break;
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
			if (Date.now() > deadline)
				throw new Error(
					"Branding preparation lock timed out; remove .variant-prepare.lock only after confirming no preparation is running",
				);
			await Bun.sleep(100);
		}
	}
	try {
		await prepareVariant(await resolveVariant(slug));
	} finally {
		await rm(lock, { force: true, recursive: true });
	}
}
