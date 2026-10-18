import type { VariantRepository } from "@/modules/variants/repositories/VariantRepository";
import type { PrismaOutbox } from "@/shared/infra/outbox/PrismaOutbox";
import type { TxClient, UnitOfWork } from "./UnitOfWork";
export interface Repositories {
	db: TxClient;
	variants: VariantRepository;
	outbox: PrismaOutbox;
}
export type KernelUnitOfWork = UnitOfWork<Repositories>;
export type { UnitOfWork } from "./UnitOfWork";
