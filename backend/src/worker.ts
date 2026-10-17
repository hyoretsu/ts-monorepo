import "@/env";
import { ProcessExample } from "./modules/example/useCases/ProcessExample";
import { RabbitMqBroker } from "./shared/infra/broker/RabbitMqBroker";
import { cache } from "./shared/infra/cache";
import { OutboxPublisher } from "./shared/infra/outbox/PrismaOutbox";
import { prisma } from "./shared/infra/sql";
import { createPrismaUnitOfWork } from "./shared/repositories/prisma";

const broker = new RabbitMqBroker();
const publisher = new OutboxPublisher(prisma, broker);
const processor = new ProcessExample(createPrismaUnitOfWork(prisma));
let stopped = false;
const shutdown = () => {
	stopped = true;
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
await broker.consume("process-example", "example.created", event => processor.execute(event));
await broker.consume("cache-invalidation", "example.*", event =>
	cache.invalidate(`examples:${event.userId}`),
);
try {
	while (!stopped) {
		try {
			await publisher.publishBatch();
		} catch (error) {
			console.error("Outbox publication failed", error);
		}
		await Bun.sleep(500);
	}
} finally {
	await broker.close();
	await cache.close();
	await prisma.$disconnect();
}
