import type { KernelUnitOfWork } from "@/shared/repositories";
import type { DomainEvent } from "@/shared/types/events";
export class ProcessExample {
	constructor(private readonly unitOfWork: KernelUnitOfWork) {}
	async execute(event: DomainEvent) {
		await this.unitOfWork.run(async ({ db, outbox }) => {
			// Advisory lock and receipt share the business transaction, so failures are retryable.
			await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`process-example:${event.id}`}))`;
			const key = { consumer: "process-example", eventId: event.id };
			if (await db.processedMessage.findUnique({ where: { consumer_eventId: key } })) return;
			await db.example.updateMany({
				data: { processedAt: new Date() },
				where: { id: event.aggregateId, processedAt: null, userId: event.userId },
			});
			await outbox.append({ ...event, id: crypto.randomUUID(), type: "example.processed" });
			await db.processedMessage.create({ data: key });
		});
	}
}
