import "../../../backend/tests/setup";
import { expect, test } from "bun:test";
import { Client } from "pg";

test("all migrations create the infrastructure schema", async () => {
	const db = new Client({ connectionString: process.env.DATABASE_URL });
	await db.connect();
	try {
		const result = await db.query(`SELECT tablename FROM pg_tables WHERE schemaname='public'`);
		for (const name of ["Example", "OutboxEvent", "ProcessedMessage", "session"])
			expect(result.rows.map(row => row.tablename)).toContain(name);
	} finally {
		await db.end();
	}
});
