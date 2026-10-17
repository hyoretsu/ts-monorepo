import "../../../backend/tests/setup";
import { expect, test } from "bun:test";
import { adapter, PrismaClient, prismaExtensionKysely } from "../src";

test("Prisma and Kysely share transaction rollback", async () => {
	const db = new PrismaClient({ adapter }).$extends(prismaExtensionKysely());
	const id = crypto.randomUUID();
	try {
		await expect(
			db.$transaction(async tx => {
				await tx.example.create({ data: { id, name: "Rollback", userId: "owner" } });
				const row = await tx.$kysely
					.selectFrom("Example")
					.select("id")
					.where("id", "=", id)
					.executeTakeFirst();
				expect(row?.id).toBe(id);
				throw new Error("abort");
			}),
		).rejects.toThrow("abort");
		expect(await db.example.findUnique({ where: { id } })).toBeNull();
	} finally {
		await db.$disconnect();
	}
});
