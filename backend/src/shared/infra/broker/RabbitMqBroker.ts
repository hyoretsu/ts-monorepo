import {
	linkedOperation,
	markOperationFailed,
	operation,
	recordDelivery,
	recordJob,
} from "@template/observability";
import amqp, { type ChannelModel, type ConfirmChannel, type ConsumeMessage } from "amqplib";
import type { DomainEvent, EventBroker } from "@/shared/types/events";
import { serviceExchange, serviceKey } from "../service-namespace";

type Handler = (event: DomainEvent) => Promise<void>;
export class RabbitMqBroker implements EventBroker {
	private connection?: ChannelModel;
	private channel?: ConfirmChannel;
	private connecting?: Promise<ConfirmChannel>;
	private stopped = false;
	private reconnectTimer?: ReturnType<typeof setTimeout>;
	private readonly handlers = new Map<string, { pattern: string; handler: Handler }>();
	private async connect() {
		if (this.channel) return this.channel;
		if (this.connecting) return this.connecting;
		this.connecting = (async () => {
			const connection = await amqp.connect(process.env.RABBITMQ_URL ?? "amqp://localhost");
			connection.on("error", () => undefined);
			connection.on("close", () => {
				this.channel = undefined;
				this.connection = undefined;
				this.scheduleReconnect();
			});
			this.connection = connection;
			const channel = await connection.createConfirmChannel();
			channel.on("error", () => undefined);
			channel.on("close", () => {
				if (this.channel === channel) {
					this.channel = undefined;
					void connection.close().catch(() => undefined);
				}
			});
			await channel.assertExchange(serviceExchange("events"), "topic", { durable: true });
			await channel.prefetch(Number(process.env.RABBITMQ_PREFETCH ?? 1));
			this.channel = channel;
			await this.topology(channel, "process-example", "example.created");
			await this.topology(channel, "cache-invalidation", "example.*");
			for (const [name, registration] of this.handlers)
				await this.register(channel, name, registration.pattern, registration.handler);
			return channel;
		})().finally(() => {
			this.connecting = undefined;
		});
		return this.connecting;
	}
	private scheduleReconnect() {
		if (this.stopped || this.reconnectTimer || !this.handlers.size) return;
		this.reconnectTimer = setTimeout(() => {
			this.reconnectTimer = undefined;
			void this.connect().catch(() => this.scheduleReconnect());
		}, 1000);
	}
	private async topology(channel: ConfirmChannel, name: string, pattern: string) {
		const queue = serviceKey(name);
		await channel.assertQueue(`${queue}.dlq`, { arguments: { "x-queue-type": "quorum" }, durable: true });
		await channel.assertQueue(queue, { arguments: { "x-queue-type": "quorum" }, durable: true });
		await channel.assertQueue(`${queue}.retry`, {
			arguments: {
				"x-dead-letter-exchange": "",
				"x-dead-letter-routing-key": queue,
				"x-dead-letter-strategy": "at-least-once",
				"x-message-ttl": 1000,
				"x-overflow": "reject-publish",
				"x-queue-type": "quorum",
			},
			durable: true,
		});
		await channel.bindQueue(queue, serviceExchange("events"), pattern);
	}
	private async register(channel: ConfirmChannel, name: string, pattern: string, handler: Handler) {
		await this.topology(channel, name, pattern);
		const queue = serviceKey(name);
		await channel.consume(
			queue,
			/* @otel-ignore */ message => {
				if (message) void this.handle(channel, name, queue, message, handler);
			},
		);
	}
	private send(channel: ConfirmChannel, queue: string, message: ConsumeMessage, attempts: number) {
		return new Promise<void>((resolve, reject) =>
			channel.sendToQueue(
				queue,
				message.content,
				{
					contentType: "application/json",
					headers: { ...message.properties.headers, attempts },
					persistent: true,
				},
				error => (error ? reject(error) : resolve()),
			),
		);
	}
	private async handle(
		channel: ConfirmChannel,
		name: string,
		queue: string,
		message: ConsumeMessage,
		handler: Handler,
	) {
		let event: DomainEvent | undefined;
		try {
			event = JSON.parse(message.content.toString()) as DomainEvent;
		} catch {
			/* Invalid envelopes follow the retry/DLQ policy below. */
		}
		const startedAt = performance.now();
		const timestamp = message.properties.timestamp as number | undefined;
		const lagMs = timestamp === undefined ? null : Math.max(0, Date.now() - timestamp);
		// Delayed consumption starts a new trace linked to the publishing request, never a child of it.
		await linkedOperation("messaging.process", event?.telemetryContext, async () => {
			let result: "completed" | "failed_dlq" | "failed_retry" = "completed";
			try {
				if (!event) throw new Error("Invalid event envelope");
				await handler(event);
				channel.ack(message);
			} catch {
				const attempts = Number(message.properties.headers?.attempts ?? 0) + 1;
				const exhausted = attempts >= Number(process.env.RABBITMQ_MAX_ATTEMPTS ?? 3);
				result = exhausted ? "failed_dlq" : "failed_retry";
				markOperationFailed();
				try {
					await operation(exhausted ? "messaging.dlq" : "messaging.retry", async () => {
						await this.send(
							channel,
							exhausted ? `${queue}.dlq` : `${queue}.retry`,
							message,
							attempts,
						);
						channel.ack(message);
					});
				} catch {
					try {
						channel.nack(message, false, true);
					} catch {
						/* Closed channels redeliver unacknowledged messages. */
					}
				}
			}
			recordDelivery(name, result);
			recordJob(name, lagMs, result === "completed" ? "ok" : "error");
			console.info(
				JSON.stringify({
					durationMs: Number((performance.now() - startedAt).toFixed(2)),
					outcome: result === "completed" ? "ok" : "error",
					queue: name,
					queueLagMs: lagMs,
					type: "worker_job",
				}),
			);
		});
	}
	async consume(name: string, pattern: string, handler: Handler) {
		const existed = this.channel;
		this.handlers.set(name, { handler, pattern });
		try {
			const channel = await this.connect();
			if (existed) await this.register(channel, name, pattern, handler);
		} catch {
			this.scheduleReconnect();
		}
	}
	async publish(event: DomainEvent) {
		const channel = await this.connect();
		await new Promise<void>((resolve, reject) =>
			channel.publish(
				serviceExchange("events"),
				event.type,
				Buffer.from(JSON.stringify(event)),
				{
					contentType: "application/json",
					messageId: event.id,
					persistent: true,
					timestamp: Date.now(),
				},
				error => (error ? reject(error) : resolve()),
			),
		);
	}
	async close() {
		this.stopped = true;
		if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
		await this.connecting?.catch(() => undefined);
		await this.connection?.close();
	}
}
