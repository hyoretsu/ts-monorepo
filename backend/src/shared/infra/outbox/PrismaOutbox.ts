import { captureContext, linkedOperation, recordOutboxBacklog } from "@template/observability";
import type { TxClient } from "@/shared/repositories/UnitOfWork";
import type { DomainEvent, EventBroker } from "@/shared/types/events";
import { type DatabaseClient, queryRaw } from "../sql";

export class PrismaOutbox {
	constructor(private readonly db: TxClient) {}
	async append(event: DomainEvent) {
		await this.db.orm.public.OutboxEvent.create({
			aggregateId: event.aggregateId,
			id: event.id,
			payload: JSON.parse(JSON.stringify(event.payload)),
			telemetryContext: event.telemetryContext ?? captureContext(),
			type: event.type,
			userId: event.userId,
		});
	}
}
export class OutboxPublisher {
	constructor(
		private readonly db: DatabaseClient,
		private readonly broker: EventBroker,
	) {}
	async publishBatch() {
		const token = crypto.randomUUID();
		// Claim and lease atomically; the ORM has no SKIP LOCKED update primitive.
		const rows = await queryRaw<DomainEvent>(
			`
   UPDATE "OutboxEvent" SET "leaseToken"=$1, "leaseUntil"=NOW()+INTERVAL '30 seconds'
   WHERE id IN (SELECT id FROM "OutboxEvent" WHERE "publishedAt" IS NULL AND "availableAt"<=NOW()
    AND ("leaseUntil" IS NULL OR "leaseUntil"<NOW()) ORDER BY "createdAt" FOR UPDATE SKIP LOCKED LIMIT 25)
   RETURNING id, type, "userId", "aggregateId", payload, "telemetryContext"`,
			[token],
		);
		for (const event of rows) {
			try {
				await linkedOperation("messaging.publish", event.telemetryContext, () =>
					this.broker.publish(event),
				);
				await this.db.orm.public.OutboxEvent.where({
					id: event.id,
					leaseToken: token,
				}).updateAndCount({ leaseToken: null, leaseUntil: null, publishedAt: new Date() });
			} catch {
				await this.db.orm.public.OutboxEvent.where({
					id: event.id,
					leaseToken: token,
				}).updateAndCount({
					availableAt: new Date(Date.now() + 5000),
					leaseToken: null,
					leaseUntil: null,
				});
			}
		}
		return rows.length;
	}
	/** Unpublished events, reported as a gauge; telemetry reads must never stop publication. */
	async recordBacklog() {
		try {
			const [row] = await queryRaw<{ count: string }>(
				'SELECT count(*)::text AS count FROM "OutboxEvent" WHERE "publishedAt" IS NULL',
			);
			recordOutboxBacklog(Number(row?.count ?? 0));
		} catch {
			/* Backlog is informational. */
		}
	}
}
