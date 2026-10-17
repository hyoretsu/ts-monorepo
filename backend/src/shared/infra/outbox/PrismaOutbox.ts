import type { TxClient } from "@/shared/repositories/UnitOfWork";
import type { DomainEvent, EventBroker } from "@/shared/types/events";
import type { PrismaInstance } from "../sql";

export class PrismaOutbox {
	constructor(private readonly db: TxClient) {}
	async append(event: DomainEvent) {
		await this.db.outboxEvent.create({
			data: {
				aggregateId: event.aggregateId,
				id: event.id,
				payload: JSON.parse(JSON.stringify(event.payload)),
				type: event.type,
				userId: event.userId,
			},
		});
	}
}
export class OutboxPublisher {
	constructor(
		private readonly db: PrismaInstance,
		private readonly broker: EventBroker,
	) {}
	async publishBatch() {
		const token = crypto.randomUUID();
		const rows = await this.db.$queryRaw<DomainEvent[]>`
   UPDATE "OutboxEvent" SET "leaseToken"=${token}, "leaseUntil"=NOW()+INTERVAL '30 seconds'
   WHERE id IN (SELECT id FROM "OutboxEvent" WHERE "publishedAt" IS NULL AND "availableAt"<=NOW()
    AND ("leaseUntil" IS NULL OR "leaseUntil"<NOW()) ORDER BY "createdAt" FOR UPDATE SKIP LOCKED LIMIT 25)
   RETURNING id, type, "userId", "aggregateId", payload`;
		for (const event of rows) {
			try {
				await this.broker.publish(event);
				await this.db.outboxEvent.updateMany({
					data: { leaseToken: null, leaseUntil: null, publishedAt: new Date() },
					where: { id: event.id, leaseToken: token },
				});
			} catch {
				await this.db.outboxEvent.updateMany({
					data: { availableAt: new Date(Date.now() + 5000), leaseToken: null, leaseUntil: null },
					where: { id: event.id, leaseToken: token },
				});
			}
		}
		return rows.length;
	}
}
