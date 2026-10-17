import { PrismaOutbox } from "@/shared/infra/outbox/PrismaOutbox";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { KernelUnitOfWork, Repositories } from "@/shared/repositories";
import type { TxClient } from "@/shared/repositories/UnitOfWork";
export function buildPrismaRepositories(db: TxClient): Repositories {
	return { db, outbox: new PrismaOutbox(db) };
}
export function createPrismaUnitOfWork(prisma: PrismaInstance): KernelUnitOfWork {
	return {
		repos: buildPrismaRepositories(prisma),
		async run(fn) {
			const effects: Array<() => Promise<void>> = [];
			const value = await prisma.$transaction(tx =>
				fn(buildPrismaRepositories(tx), effect => effects.push(effect)),
			);
			// A failed post-commit cache effect must not report an already committed write as failed.
			await Promise.allSettled(effects.map(effect => effect()));
			return value;
		},
	};
}
