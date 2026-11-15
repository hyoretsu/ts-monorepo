export interface DomainEvent {
	id: string;
	type: string;
	userId: string;
	aggregateId: string;
	payload: Record<string, unknown>;
	/** W3C trace context captured when the event was recorded; links delayed publication and consumption. */
	telemetryContext?: Record<string, string>;
}
export interface EventBroker {
	publish(event: DomainEvent): Promise<void>;
	close(): Promise<void>;
}
export interface Cache {
	read<T>(scope: string, key: string, load: () => Promise<T>): Promise<T>;
	invalidate(scope: string): Promise<void>;
	close(): Promise<void>;
}
