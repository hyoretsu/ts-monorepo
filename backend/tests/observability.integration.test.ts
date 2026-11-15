import "./setup";
import { afterAll, expect, test } from "bun:test";
import { context, propagation, trace } from "@opentelemetry/api";
import { AsyncLocalStorageContextManager } from "@opentelemetry/context-async-hooks";
import { W3CTraceContextPropagator } from "@opentelemetry/core";
import { InMemorySpanExporter, SimpleSpanProcessor, TracerProvider } from "@opentelemetry/sdk-trace";
import { operation } from "@template/observability";
import { instrumentRequest, setHttpRoute } from "@template/observability/http";
import { OutboxPublisher } from "../src/shared/infra/outbox/PrismaOutbox";
import { db, queryRaw } from "../src/shared/infra/sql";
import { createPrismaUnitOfWork } from "../src/shared/repositories/prisma";
import type { DomainEvent } from "../src/shared/types/events";

const exporter = new InMemorySpanExporter();
context.setGlobalContextManager(new AsyncLocalStorageContextManager().enable());
propagation.setGlobalPropagator(new W3CTraceContextPropagator());
trace.setGlobalTracerProvider(
	new TracerProvider({ spanProcessors: [new SimpleSpanProcessor({ exporter })] }),
);
process.env.OTEL_EXPORTER_OTLP_ENDPOINT = "http://127.0.0.1:1";
afterAll(() => {
	delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
});

test("the outbox persists the request trace context and publication links back to it", async () => {
	const id = crypto.randomUUID();
	const handle = instrumentRequest(() =>
		operation("fixture.handler", async () => {
			setHttpRoute("/fixture/:id");
			await createPrismaUnitOfWork(db).run(({ outbox }) =>
				outbox.append({
					aggregateId: id,
					id,
					payload: { technical: true },
					type: "example.created",
					userId: "owner",
				}),
			);
			return Response.json({ status: "queued" });
		}),
	);
	const response = await handle(
		new Request("http://localhost/fixture/private-id", {
			headers: { traceparent: `00-${"1".repeat(32)}-${"2".repeat(16)}-01` },
		}),
	);
	await response.text();

	const [row] = await queryRaw<{ telemetryContext: { traceparent: string } }>(
		'SELECT "telemetryContext" FROM "OutboxEvent" WHERE id=$1',
		[id],
	);
	expect(row?.telemetryContext.traceparent).toContain("1".repeat(32));

	// Publication reads the context from storage, so it still links after a publisher restart.
	const published: DomainEvent[] = [];
	await new OutboxPublisher(db, {
		close: async () => undefined,
		publish: async event => {
			published.push(event);
		},
	}).publishBatch();
	expect(published.find(event => event.id === id)?.telemetryContext?.traceparent).toContain("1".repeat(32));

	const spans = exporter.getFinishedSpans();
	expect(
		spans.some(
			span =>
				span.name === "messaging.publish" &&
				span.links.some(link => link.context.traceId === "1".repeat(32)),
		),
	).toBe(true);
	expect(
		spans.some(span => span.name === "db.INSERT" && span.spanContext().traceId === "1".repeat(32)),
	).toBe(true);
	expect(JSON.stringify(spans.map(span => span.attributes))).not.toContain("private-id");
});
