import type { TxClient } from "@/shared/repositories/UnitOfWork";
import type { CreateVariantBody, UpdateVariantBody } from "../dtos";

export class VariantRepository {
	constructor(private readonly db: TxClient) {}
	list() {
		return this.db.$kysely.selectFrom("Variant").selectAll().orderBy("slug").execute();
	}
	find(id: string) {
		return this.db.$kysely.selectFrom("Variant").selectAll().where("id", "=", id).executeTakeFirst();
	}
	create(data: CreateVariantBody) {
		return this.db.$kysely
			.insertInto("Variant")
			.values({ ...data, id: crypto.randomUUID(), updatedAt: new Date() })
			.returningAll()
			.executeTakeFirstOrThrow();
	}
	update(id: string, data: UpdateVariantBody) {
		return this.db.$kysely
			.updateTable("Variant")
			.set({ ...data, updatedAt: new Date() })
			.where("id", "=", id)
			.returningAll()
			.executeTakeFirst();
	}
	delete(id: string) {
		return this.db.$kysely.deleteFrom("Variant").where("id", "=", id).returningAll().executeTakeFirst();
	}
}
