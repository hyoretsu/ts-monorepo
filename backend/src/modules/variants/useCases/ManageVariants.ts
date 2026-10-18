import type { KernelUnitOfWork } from "@/shared/repositories";
import type { CreateVariantBody, UpdateVariantBody } from "../dtos";

export class ManageVariants {
	constructor(private readonly uow: KernelUnitOfWork) {}
	list() {
		return this.uow.repos.variants.list();
	}
	find(id: string) {
		return this.uow.repos.variants.find(id);
	}
	create(data: CreateVariantBody) {
		return this.uow.run(({ variants }) => variants.create(data));
	}
	update(id: string, data: UpdateVariantBody) {
		return this.uow.run(({ variants }) => variants.update(id, data));
	}
	delete(id: string) {
		return this.uow.run(({ variants }) => variants.delete(id));
	}
}
