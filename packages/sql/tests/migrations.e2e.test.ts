import "../../../backend/tests/setup";
import { expect, test } from "bun:test";
import { readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { Client } from "pg";
import { adoptLegacy, assertDisposableLegacyDatabase, prismaCommand } from "../scripts/adopt-legacy";

test("fresh native migrations create the infrastructure schema and valid signature", async () => {
	const url = process.env.DATABASE_URL;
	if (!url || !process.env.TEMPLATE_DISPOSABLE_TEST_RUN) throw new Error("Use the disposable E2E runner");
	const db = new Client({ connectionString: url });
	await db.connect();
	try {
		const result = await db.query(`SELECT tablename FROM pg_tables WHERE schemaname='public'`);
		for (const name of ["Example", "OutboxEvent", "ProcessedMessage", "session", "Variant"])
			expect(result.rows.map(row => row.tablename)).toContain(name);
		expect((await prismaCommand(url, ["db", "verify"])).code).toBe(0);
	} finally {
		await db.end();
	}
}, 120000);

test("legacy adoption rejects non-disposable targets before connecting", () => {
	const namespace = `template_test_${"a".repeat(32)}`;
	for (const url of [
		"postgresql://localhost/production",
		`postgresql://example.com/${namespace}_legacy`,
		`postgresql://localhost/${namespace}_legacy?host=example.com`,
	])
		expect(() => assertDisposableLegacyDatabase(url, namespace)).toThrow("runner-owned");
	expect(() =>
		assertDisposableLegacyDatabase(`postgresql://localhost/${namespace}_legacy`, undefined),
	).toThrow();
});

test("historical SQL adoption preserves data and physical names, repeats safely, and rejects drift", async () => {
	const namespace = process.env.TEMPLATE_DISPOSABLE_TEST_RUN;
	const base = process.env.DATABASE_URL;
	if (!base || !namespace) throw new Error("Use the disposable E2E runner");
	const target = new URL(base);
	target.pathname = `/${namespace}_legacy`;
	assertDisposableLegacyDatabase(target.href, namespace);
	const admin = new Client({ connectionString: base });
	await admin.connect();
	const name = `${namespace}_legacy`;
	let db: Client | undefined;
	let created = false;
	try {
		await admin.query(`CREATE DATABASE "${name}"`);
		created = true;
		db = new Client({ connectionString: target.href });
		await db.connect();
		const directory = resolve(import.meta.dir, "../src/migrations");
		for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) =>
			a.name.localeCompare(b.name),
		)) {
			if (entry.isDirectory())
				await db.query(await Bun.file(resolve(directory, entry.name, "migration.sql")).text());
		}
		await db.query(
			`INSERT INTO "user" (id, name, email, "updatedAt") VALUES ('legacy-user', 'Before adoption', 'legacy@example.test', TIMESTAMP '2026-10-01 12:34:56.789')`,
		);
		await db.query(
			`INSERT INTO "Variant" (id, slug, name, "updatedAt") VALUES ('legacy-variant', 'legacy', 'Original', TIMESTAMP '2026-10-01 12:34:56.789')`,
		);
		const snapshot = async () => {
			const data = await db!.query(
				`SELECT row_to_json(u)::text AS value FROM "user" u UNION ALL SELECT row_to_json(v)::text FROM "Variant" v ORDER BY value`,
			);
			const physical = await db!.query(
				`SELECT tablename, indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname`,
			);
			const constraints = await db!.query(
				`SELECT c.relname, k.conname, pg_get_constraintdef(k.oid) AS definition FROM pg_constraint k JOIN pg_class c ON c.oid = k.conrelid JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' ORDER BY c.relname, k.conname`,
			);
			const columns = await db!.query(
				`SELECT table_name, column_name, data_type, udt_name, is_nullable, column_default, datetime_precision FROM information_schema.columns WHERE table_schema = 'public' ORDER BY table_name, ordinal_position`,
			);
			return JSON.stringify({
				columns: columns.rows,
				constraints: constraints.rows,
				data: data.rows,
				physical: physical.rows,
			});
		};
		const original = await snapshot();
		await db.query(`ALTER TABLE "Variant" RENAME COLUMN "themeColors" TO "unexpected_description"`);
		await expect(adoptLegacy(target.href, namespace)).rejects.toThrow("schema verification failed");
		expect((await prismaCommand(target.href, ["db", "verify", "--marker-only"])).code).not.toBe(0);
		await db.query(`ALTER TABLE "Variant" RENAME COLUMN "unexpected_description" TO "themeColors"`);
		expect((await prismaCommand(target.href, ["db", "verify"])).code).not.toBe(0);
		const compatibility = await prismaCommand(target.href, ["db", "verify", "--schema-only"]);
		if (compatibility.code !== 0) throw new Error(compatibility.output);
		await adoptLegacy(target.href, namespace);
		expect(await snapshot()).toBe(original);
		await adoptLegacy(target.href, namespace);
		expect(await snapshot()).toBe(original);
		await db.query(`ALTER TABLE "Variant" DROP COLUMN "themeColors"`);
		expect((await prismaCommand(target.href, ["db", "verify", "--schema-only"])).code).not.toBe(0);
		await expect(adoptLegacy(target.href, namespace)).rejects.toThrow("schema verification failed");
	} finally {
		await db?.end();
		if (created) await admin.query(`DROP DATABASE "${name}" WITH (FORCE)`);
		await admin.end();
	}
}, 240000);
