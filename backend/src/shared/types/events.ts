export interface DomainEvent {
	id: string;
	type: string;
	userId: string;
	aggregateId: string;
	payload: Record<string, unknown>;
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
