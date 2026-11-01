import "../../../backend/tests/setup";
import { afterAll, expect, test } from "bun:test";
import { closeDatabase, db, queryRaw, withTransaction } from "../src";

afterAll(closeDatabase);

test("ORM, builder and raw SQL share transaction rollback and physical connection", async () => {
	const id = crypto.randomUUID();
	await expect(
		withTransaction(async transaction => {
			await transaction.orm.public.Example.create({ id, name: "Rollback", userId: "owner" });
			const plan = transaction.sql.public.Example.select("id")
				.where((fields, ops) => ops.eq(fields.id, id))
				.build();
			expect((await transaction.query(plan))[0]?.id).toBe(id);
			const [connection] = await queryRaw<{ pid: number }>("select pg_backend_pid() as pid");
			await withTransaction(async () => {
				expect((await queryRaw<{ pid: number }>("select pg_backend_pid() as pid"))[0]?.pid).toBe(
					connection?.pid,
				);
			});
			throw new Error("abort");
		}),
	).rejects.toThrow("abort");
	expect(await db.orm.public.Example.where({ id }).first()).toBeNull();
});
