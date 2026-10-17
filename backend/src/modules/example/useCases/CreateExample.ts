import { normalizeExampleName } from "@template/domain";
import { cache } from "@/shared/infra/cache";
import type { KernelUnitOfWork } from "@/shared/repositories";
import type { CreateExampleDTO } from "../dtos/CreateExample";
export class CreateExample {
	constructor(private readonly unitOfWork: KernelUnitOfWork) {}
	async execute(data: CreateExampleDTO) {
		return this.unitOfWork.run(async ({ db, outbox }, afterCommit) => {
			const example = await db.example.create({
				data: { name: normalizeExampleName(data.name), userId: data.userId },
			});
			await outbox.append({
				aggregateId: example.id,
				id: crypto.randomUUID(),
				payload: {},
				type: "example.created",
				userId: data.userId,
			});
			afterCommit(() => cache.invalidate(`examples:${data.userId}`));
			return {
				createdAt: example.createdAt.toISOString(),
				id: example.id,
				name: example.name,
				processedAt: null,
			};
		});
	}
}
