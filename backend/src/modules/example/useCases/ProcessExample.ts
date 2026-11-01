import { queryRaw } from "@/shared/infra/sql";
import type { KernelUnitOfWork } from "@/shared/repositories";
import type { DomainEvent } from "@/shared/types/events";
export class ProcessExample {
	constructor(private readonly unitOfWork: KernelUnitOfWork) {}
	async execute(event: DomainEvent) {
		await this.unitOfWork.run(async ({ db, outbox }) => {
			// Advisory lock and receipt share the business transaction, so failures are retryable.
			await queryRaw("SELECT pg_advisory_xact_lock(hashtext($1))", [`process-example:${event.id}`]);
			const key = { consumer: "process-example", eventId: event.id };
			const receipt = db.sql.public.ProcessedMessage.select("consumer", "eventId")
				.where((fields, ops) =>
					ops.and(ops.eq(fields.consumer, key.consumer), ops.eq(fields.eventId, key.eventId)),
				)
				.limit(1)
				.build();
			if ((await db.query(receipt)).length > 0) return;
			await db.orm.public.Example.where({
				id: event.aggregateId,
				processedAt: null,
				userId: event.userId,
			}).updateAndCount({ processedAt: new Date() });
			await outbox.append({ ...event, id: crypto.randomUUID(), type: "example.processed" });
			await db.orm.public.ProcessedMessage.create(key);
		});
	}
}
