import type { TxClient } from "@/shared/repositories/UnitOfWork";
import type { CreateVariantBody, UpdateVariantBody } from "../dtos";

export class VariantRepository {
	constructor(private readonly db: TxClient) {}
	list() {
		return this.db.orm.public.Variant.orderBy(variant => variant.slug.asc()).all();
	}
	async find(id: string) {
		return (await this.db.orm.public.Variant.where({ id }).first()) ?? undefined;
	}
	create(data: CreateVariantBody) {
		return this.db.orm.public.Variant.create({ ...data, id: crypto.randomUUID(), updatedAt: new Date() });
	}
	async update(id: string, data: UpdateVariantBody) {
		return (
			(await this.db.orm.public.Variant.where({ id }).update({ ...data, updatedAt: new Date() })) ??
			undefined
		);
	}
	async delete(id: string) {
		return (await this.db.orm.public.Variant.where({ id }).delete()) ?? undefined;
	}
}
