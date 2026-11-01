import type { DatabaseClient } from "@/shared/infra/sql";
export type TxClient = DatabaseClient;
export interface UnitOfWork<Ctx> {
	readonly repos: Ctx;
	run<T>(fn: (ctx: Ctx, afterCommit: (effect: () => Promise<void>) => void) => Promise<T>): Promise<T>;
}
