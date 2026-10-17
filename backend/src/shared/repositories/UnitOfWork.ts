import type { PrismaInstance } from "@/shared/infra/sql";
export type TxClient = Parameters<Parameters<PrismaInstance["$transaction"]>[0]>[0];
export interface UnitOfWork<Ctx> {
	readonly repos: Ctx;
	run<T>(fn: (ctx: Ctx, afterCommit: (effect: () => Promise<void>) => void) => Promise<T>): Promise<T>;
}
