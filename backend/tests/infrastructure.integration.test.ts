import "./setup";
import { afterAll, expect, test } from "bun:test";
import amqp from "amqplib";
import { ProcessExample } from "../src/modules/example/useCases/ProcessExample";
import { AuthSecondaryStorage } from "../src/shared/infra/auth-secondary-storage";
import { RabbitMqBroker } from "../src/shared/infra/broker/RabbitMqBroker";
import { cache } from "../src/shared/infra/cache";
import { OutboxPublisher } from "../src/shared/infra/outbox/PrismaOutbox";
import { serviceKey } from "../src/shared/infra/service-namespace";
import { prisma } from "../src/shared/infra/sql";
import { createPrismaUnitOfWork } from "../src/shared/repositories/prisma";

const uow = createPrismaUnitOfWork(prisma);
afterAll(async () => {
	await cache.close();
	await prisma.$disconnect();
});
test("business writes and outbox roll back together", async () => {
	const id = crypto.randomUUID();
	await expect(
		uow.run(async ({ db, outbox }) => {
			await db.example.create({ data: { id, name: "Rollback", userId: "owner" } });
			await outbox.append({ aggregateId: id, id, payload: {}, type: "example.created", userId: "owner" });
			throw new Error("abort");
		}),
	).rejects.toThrow("abort");
	expect(await prisma.example.findUnique({ where: { id } })).toBeNull();
	expect(await prisma.outboxEvent.findUnique({ where: { id } })).toBeNull();
});
test("processing is deduplicated in the same database transaction", async () => {
	const row = await prisma.example.create({ data: { name: "Process", userId: "owner" } });
	const event = {
		aggregateId: row.id,
		id: crypto.randomUUID(),
		payload: {},
		type: "example.created",
		userId: "owner",
	};
	const processor = new ProcessExample(uow);
	await Promise.all([processor.execute(event), processor.execute(event)]);
	expect(await prisma.processedMessage.count({ where: { eventId: event.id } })).toBe(1);
	expect(await prisma.outboxEvent.count({ where: { aggregateId: row.id, type: "example.processed" } })).toBe(
		1,
	);
});
test("failed publication releases lease for recovery", async () => {
	await prisma.outboxEvent.deleteMany();
	const id = crypto.randomUUID();
	await uow.repos.outbox.append({
		aggregateId: id,
		id,
		payload: {},
		type: "example.created",
		userId: "owner",
	});
	let fail = true;
	const publisher = new OutboxPublisher(prisma, {
		close: async () => {},
		publish: async () => {
			if (fail) throw new Error("offline");
		},
	});
	await publisher.publishBatch();
	expect((await prisma.outboxEvent.findUniqueOrThrow({ where: { id } })).publishedAt).toBeNull();
	await prisma.outboxEvent.update({
		data: { availableAt: new Date(0), leaseUntil: new Date(0) },
		where: { id },
	});
	fail = false;
	await publisher.publishBatch();
	expect((await prisma.outboxEvent.findUniqueOrThrow({ where: { id } })).publishedAt).not.toBeNull();
});
test("invalidation wins against a concurrent cache fill", async () => {
	const scope = crypto.randomUUID();
	let release: () => void = () => {};
	const ready = Promise.withResolvers<void>();
	const pending = cache.read(scope, "key", async () => {
		ready.resolve();
		await new Promise<void>(resolve => {
			release = resolve;
		});
		return "old";
	});
	await ready.promise;
	await cache.invalidate(scope);
	release();
	await pending;
	expect(await cache.read(scope, "key", async () => "new")).toBe("new");
});
test("revoked sessions never authorize from their Redis mirror", async () => {
	const storage = new AuthSecondaryStorage();
	const token = crypto.randomUUID();
	await storage.set(token, JSON.stringify({ session: { id: "revoked" }, user: { id: "owner" } }));
	expect(await storage.get(token)).toBeNull();
	storage.client.close();
});
test("broker retries failed handlers into a dead-letter queue", async () => {
	const broker = new RabbitMqBroker();
	const queue = `failure-${crypto.randomUUID()}`;
	await broker.consume(queue, "test.failure", async () => {
		throw new Error("retry");
	});
	await broker.publish({
		aggregateId: "item",
		id: crypto.randomUUID(),
		payload: {},
		type: "test.failure",
		userId: "owner",
	});
	const connection = await amqp.connect(process.env.RABBITMQ_URL!);
	const channel = await connection.createChannel();
	try {
		const deadline = Date.now() + 15000;
		let count = 0;
		while (Date.now() < deadline) {
			count = (await channel.checkQueue(`${serviceKey(queue)}.dlq`)).messageCount;
			if (count) break;
			await Bun.sleep(200);
		}
		expect(count).toBe(1);
	} finally {
		await connection.close();
		await broker.close();
	}
});
