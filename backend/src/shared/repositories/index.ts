import type { PrismaOutbox } from "@/shared/infra/outbox/PrismaOutbox";
import type { TxClient, UnitOfWork } from "./UnitOfWork";
export interface Repositories {
	db: TxClient;
	outbox: PrismaOutbox;
}
export type KernelUnitOfWork = UnitOfWork<Repositories>;
export type { UnitOfWork } from "./UnitOfWork";
