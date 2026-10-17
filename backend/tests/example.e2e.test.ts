import "./setup";
import { afterAll, expect, test } from "bun:test";
import { ProcessExample } from "../src/modules/example/useCases/ProcessExample";
import { server } from "../src/server";
import { RabbitMqBroker } from "../src/shared/infra/broker/RabbitMqBroker";
import { cache } from "../src/shared/infra/cache";
import { OutboxPublisher } from "../src/shared/infra/outbox/PrismaOutbox";
import { prisma } from "../src/shared/infra/sql";
import { createPrismaUnitOfWork } from "../src/shared/repositories/prisma";

await server.modules;
server.compile();
const broker = new RabbitMqBroker();
afterAll(async () => {
	await broker.close();
	await cache.close();
	await prisma.$disconnect();
});
async function request(path: string, method = "GET", body?: unknown, cookie = "") {
	return server.handle(
		new Request(`http://localhost:3333${path}`, {
			headers: { "Content-Type": "application/json", Cookie: cookie, Origin: "http://localhost:5173" },
			method,
			...(body ? { body: JSON.stringify(body) } : {}),
		}),
	);
}
async function user() {
	const email = `${crypto.randomUUID()}@example.com`;
	const response = await request("/auth/sign-up/email", "POST", {
		email,
		name: "Test",
		password: "local-test-password",
	});
	if (response.status !== 200) throw new Error(`Sign-up failed: ${response.status} ${await response.text()}`);
	return response.headers
		.getSetCookie()
		.map(value => value.split(";")[0])
		.join("; ");
}
test("authenticated creation reaches worker and remains isolated by user", async () => {
	const owner = await user();
	const other = await user();
	expect((await request("/example/")).status).toBe(401);
	expect((await request("/example/", "POST", { name: "   " }, owner)).status).toBe(422);
	const created = await (await request("/example/", "POST", { name: " E2E record " }, owner)).json();
	expect(created.name).toBe("E2E record");
	const processor = new ProcessExample(createPrismaUnitOfWork(prisma));
	await broker.consume("process-example", "example.created", event => processor.execute(event));
	await broker.consume("cache-invalidation", "example.*", event =>
		cache.invalidate(`examples:${event.userId}`),
	);
	const publisher = new OutboxPublisher(prisma, broker);
	const deadline = Date.now() + 10000;
	let processed = false;
	while (Date.now() < deadline) {
		await publisher.publishBatch();
		const page = await (await request("/example/", "GET", undefined, owner)).json();
		processed = !!page.items.find(
			(item: { id: string; processedAt: string | null }) => item.id === created.id,
		)?.processedAt;
		if (processed) break;
		await Bun.sleep(200);
	}
	expect(processed).toBe(true);
	expect((await (await request("/example/", "GET", undefined, other)).json()).items).toEqual([]);
});
