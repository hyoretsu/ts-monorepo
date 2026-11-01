import "dotenv/config";
import { AsyncLocalStorage } from "node:async_hooks";
import postgres from "@prisma/orm-postgres/runtime";
import { contractFromJson } from "@prisma/orm-postgres/static";
import { Pool, type PoolClient, type QueryResultRow } from "pg";
import type { Contract } from "../out/prisma/contract";
import contractJson from "../out/prisma/contract.json" with { type: "json" };

export { and, or } from "@prisma/orm-postgres/orm-client";

const env = process.env;
// Importing SQL for OpenAPI/build generation must not require a running database.
const pool = new Pool({
	connectionString: env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/example",
	idleTimeoutMillis: Number(env.PRISMA_POOL_IDLE_TIMEOUT_MS || 30000),
	max: Number(env.PRISMA_POOL_MAX || 20),
	min: Number(env.PRISMA_POOL_MIN || 2),
});
type Effect = () => Promise<void> | void;
interface TransactionContext {
	client: PoolClient;
	effects: Effect[];
	failed: boolean;
}
const transactions = new AsyncLocalStorage<TransactionContext>();
const borrowed = new WeakMap<PoolClient, PoolClient>();
// Both ORM and builder acquire through this pool. Borrowed connections cannot be
// released by the runtime before the owning physical transaction finishes.
const transactionalPool = new Proxy(pool, {
	get(target, property) {
		if (property === "connect")
			return async () => {
				const context = transactions.getStore();
				if (!context) return target.connect();
				let connection = borrowed.get(context.client);
				if (!connection) {
					connection = new Proxy(context.client, {
						get(client, key) {
							if (key === "release") return () => undefined;
							const value = Reflect.get(client, key);
							return typeof value === "function" ? value.bind(client) : value;
						},
					});
					borrowed.set(context.client, connection);
				}
				return connection;
			};
		if (property === "query")
			return (...args: unknown[]) => {
				const connection = transactions.getStore()?.client ?? target;
				return Reflect.apply(connection.query, connection, args);
			};
		const value = Reflect.get(target, property);
		return typeof value === "function" ? value.bind(target) : value;
	},
});
export const db = postgres({ contract: contractFromJson<Contract>(contractJson), pg: transactionalPool });
export type DatabaseClient = typeof db;
export const queryRaw = async <Row extends QueryResultRow>(
	text: string,
	values: unknown[] = [],
): Promise<Row[]> => (await transactionalPool.query<Row>(text, values)).rows;
export const executeRaw = async (text: string, values: unknown[] = []) =>
	transactionalPool.query(text, values);
export const afterCommit = (effect: Effect): void => {
	const context = transactions.getStore();
	if (context) context.effects.push(effect);
	else
		void Promise.resolve()
			.then(effect)
			.catch(() => undefined);
};
export const withTransaction = async <Result>(
	operation: (transaction: DatabaseClient) => Promise<Result>,
): Promise<Result> => {
	const existing = transactions.getStore();
	if (existing) {
		try {
			return await operation(db);
		} catch (error) {
			existing.failed = true;
			throw error;
		}
	}
	const client = await pool.connect();
	const context: TransactionContext = { client, effects: [], failed: false };
	let result: Result;
	try {
		await client.query("BEGIN");
		result = await transactions.run(context, () => operation(db));
		if (context.failed) throw new Error("Transaction aborted by a failed nested operation");
		await client.query("COMMIT");
	} catch (error) {
		await client.query("ROLLBACK");
		throw error;
	} finally {
		client.release();
	}
	// Effects execute outside ALS: subsequent writes cannot use a released client.
	await Promise.allSettled(context.effects.map(effect => Promise.resolve().then(effect)));
	return result;
};
export const closeDatabase = async () => {
	await db.close();
	await pool.end();
};
