import { VariantRepository } from "@/modules/variants/repositories/VariantRepository";
import { PrismaOutbox } from "@/shared/infra/outbox/PrismaOutbox";
import { afterCommit, type DatabaseClient, withTransaction } from "@/shared/infra/sql";
import type { KernelUnitOfWork, Repositories } from "@/shared/repositories";
import type { TxClient } from "@/shared/repositories/UnitOfWork";
export function buildPrismaRepositories(db: TxClient): Repositories {
	return { db, outbox: new PrismaOutbox(db), variants: new VariantRepository(db) };
}
export function createPrismaUnitOfWork(db: DatabaseClient): KernelUnitOfWork {
	return {
		repos: buildPrismaRepositories(db),
		async run(fn) {
			return withTransaction(tx => fn(buildPrismaRepositories(tx), afterCommit));
		},
	};
}
