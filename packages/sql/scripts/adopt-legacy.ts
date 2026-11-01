import { resolve } from "node:path";
import { Client } from "pg";

const workspace = resolve(import.meta.dir, "..");

/** Deliberately no operator/shared-database mode. Authorization for that is a separate procedure. */
export function assertDisposableLegacyDatabase(url: string, namespace: string | undefined) {
	const target = new URL(url);
	if (
		!namespace ||
		!/^template_test_[a-f0-9]{32}$/.test(namespace) ||
		!/^postgres(ql)?:$/.test(target.protocol) ||
		!["localhost", "127.0.0.1", "[::1]"].includes(target.hostname) ||
		decodeURIComponent(target.pathname.slice(1)) !== `${namespace}_legacy` ||
		target.searchParams.size !== 0
	)
		throw new Error(
			"Legacy adoption requires an explicit runner-owned disposable legacy database URL and namespace",
		);
}

export async function prismaCommand(url: string, args: string[]) {
	const child = Bun.spawn(["bunx", "--bun", "--no-install", "prisma", ...args, "--db", url], {
		cwd: workspace,
		env: { ...process.env, DATABASE_URL: url },
		stderr: "pipe",
		stdout: "pipe",
		timeout: 120000,
	});
	const [stdout, stderr, code] = await Promise.all([
		new Response(child.stdout).text(),
		new Response(child.stderr).text(),
		child.exited,
	]);
	return { code, output: `${stdout}${stderr}` };
}

/** No SQL repair, migration replay, marker spoofing, or schema normalization is performed here. */
export async function adoptLegacy(url: string, namespace: string | undefined) {
	assertDisposableLegacyDatabase(url, namespace);
	const db = new Client({ connectionString: url });
	await db.connect();
	try {
		// Serialize cooperating adopters for the whole verification/signing window.
		await db.query("SELECT pg_advisory_lock(724182091)");
		const tables = await db.query<{ tablename: string }>(
			`SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations' ORDER BY tablename`,
		);
		const names = tables.rows.map(row => row.tablename);
		for (const name of [
			"user",
			"session",
			"account",
			"verification",
			"Example",
			"OutboxEvent",
			"ProcessedMessage",
			"Variant",
		])
			if (!names.includes(name)) throw new Error(`Missing legacy table: ${name}`);
		const snapshot = async () => {
			const rows = [];
			for (const name of names) {
				const quoted = `"${name.replaceAll('"', '""')}"`;
				const result = await db.query(
					`SELECT to_jsonb(t)::text AS row FROM ${quoted} t ORDER BY to_jsonb(t)::text`,
				);
				rows.push([name, result.rows]);
			}
			return JSON.stringify(rows);
		};
		const before = await snapshot();
		// Full verification intentionally fails for unsigned Prisma 7 databases. Only
		// schema-only verification can authorize adoption; marker failure alone cannot.
		const current = await prismaCommand(url, ["db", "verify"]);
		const schema = await prismaCommand(url, ["db", "verify", "--schema-only"]);
		if (schema.code !== 0) throw new Error(`Legacy schema verification failed: ${schema.output}`);
		if (before !== (await snapshot())) throw new Error("Legacy data changed during verification");
		if (current.code !== 0) {
			const signed = await prismaCommand(url, ["db", "sign"]);
			if (signed.code !== 0) throw new Error(`Legacy signing failed: ${signed.output}`);
		}
		const verified = await prismaCommand(url, ["db", "verify"]);
		if (verified.code !== 0) throw new Error(`Adopted database verification failed: ${verified.output}`);
		if (before !== (await snapshot())) throw new Error("Legacy adoption changed application data");
	} finally {
		await db.end();
	}
}

if (import.meta.main) {
	const url = process.argv[2];
	if (!url) throw new Error("Usage: adopt-legacy.ts <explicit-disposable-database-url>");
	await adoptLegacy(url, process.env.TEMPLATE_DISPOSABLE_TEST_RUN);
}
