#!/usr/bin/env -S node
import { Migration, MigrationCLI, sql } from "@prisma/orm-postgres/migration";
import type { Contract as End } from "../../snapshots/1da91092a203e4f71aef8e3ed8f69b31021ed4a221ad158eb0b9a3e948350ca6/contract";
import endContract from "../../snapshots/1da91092a203e4f71aef8e3ed8f69b31021ed4a221ad158eb0b9a3e948350ca6/contract.json" with { type: "json" };
import type { Contract as Start } from "../../snapshots/e5373342848d151f564158ec07a7db3fc1f3d5b82fd5eb764b31518bce48c2a3/contract";
import startContract from "../../snapshots/e5373342848d151f564158ec07a7db3fc1f3d5b82fd5eb764b31518bce48c2a3/contract.json" with { type: "json" };

export default class M extends Migration<Start, End> {
	override readonly startContractJson = startContract;
	override readonly endContractJson = endContract;

	override get operations() {
		return [
			this.dropIndex({
				index: "Example_userId_createdAt_id_idx_786b3fe4",
				schema: "public",
				table: "Example",
			}),
			this.dropIndex({
				index: "OutboxEvent_publishedAt_availableAt_leaseUntil_idx_04a24fcf",
				schema: "public",
				table: "OutboxEvent",
			}),
			this.dropIndex({ index: "account_userId_idx_a489d58a", schema: "public", table: "account" }),
			this.dropIndex({ index: "session_userId_idx_a489d58a", schema: "public", table: "session" }),
			this.dropIndex({
				index: "verification_identifier_idx_79a0dbb3",
				schema: "public",
				table: "verification",
			}),
			this.addCheckConstraint({
				constraint: "Variant_slug_check",
				expression: sql`(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'::text)`,
				schema: "public",
				table: "Variant",
			}),
			this.addCheckConstraint({
				constraint: "Variant_theme_check",
				expression: sql`("defaultTheme" = ANY (ARRAY['light'::text, 'dark'::text, 'system'::text]))`,
				schema: "public",
				table: "Variant",
			}),
			this.createIndex({
				columns: ["userId", "createdAt", "id"],
				index: "Example_userId_createdAt_id_idx",
				schema: "public",
				table: "Example",
			}),
			this.createIndex({
				columns: ["publishedAt", "availableAt", "leaseUntil"],
				index: "OutboxEvent_publishedAt_availableAt_leaseUntil_idx",
				schema: "public",
				table: "OutboxEvent",
			}),
			this.createIndex({
				columns: ["userId"],
				index: "account_userId_idx",
				schema: "public",
				table: "account",
			}),
			this.createIndex({
				columns: ["userId"],
				index: "session_userId_idx",
				schema: "public",
				table: "session",
			}),
			this.createIndex({
				columns: ["identifier"],
				index: "verification_identifier_idx",
				schema: "public",
				table: "verification",
			}),
		];
	}
}

MigrationCLI.run(import.meta.url, M);
