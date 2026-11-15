#!/usr/bin/env -S node
import { col, Migration, MigrationCLI } from "@prisma/orm-postgres/migration";
import type { Contract as End } from "../../snapshots/275cb7fef49857410c20a9c40fec6f8e2034b265632ed8fa92ca6c6333a74bb6/contract";
import endContract from "../../snapshots/275cb7fef49857410c20a9c40fec6f8e2034b265632ed8fa92ca6c6333a74bb6/contract.json" with { type: "json" };
import type { Contract as Start } from "../../snapshots/d6e727b807a45016059ef09bb92918f9986c920eb3a8129356a33252204ef6b5/contract";
import startContract from "../../snapshots/d6e727b807a45016059ef09bb92918f9986c920eb3a8129356a33252204ef6b5/contract.json" with { type: "json" };

export default class M extends Migration<Start, End> {
	override readonly startContractJson = startContract;
	override readonly endContractJson = endContract;

	override get operations() {
		return [
			this.addColumn({
				column: col("telemetryContext", "jsonb", { codecRef: { codecId: "pg/jsonb@1" } }),
				schema: "public",
				table: "OutboxEvent",
			}),
		];
	}
}

MigrationCLI.run(import.meta.url, M);
