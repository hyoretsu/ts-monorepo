#!/usr/bin/env -S node
import { Migration, MigrationCLI } from "@prisma/orm-postgres/migration";
import type { Contract as Start } from "../../snapshots/1da91092a203e4f71aef8e3ed8f69b31021ed4a221ad158eb0b9a3e948350ca6/contract";
import startContract from "../../snapshots/1da91092a203e4f71aef8e3ed8f69b31021ed4a221ad158eb0b9a3e948350ca6/contract.json" with { type: "json" };
import type { Contract as End } from "../../snapshots/d6e727b807a45016059ef09bb92918f9986c920eb3a8129356a33252204ef6b5/contract";
import endContract from "../../snapshots/d6e727b807a45016059ef09bb92918f9986c920eb3a8129356a33252204ef6b5/contract.json" with { type: "json" };

export default class M extends Migration<Start, End> {
	override readonly startContractJson = startContract;
	override readonly endContractJson = endContract;

	override get operations() {
		return [
			this.dropConstraint({ constraint: "Variant_slug_key", schema: "public", table: "Variant" }),
			this.dropConstraint({ constraint: "session_token_key", schema: "public", table: "session" }),
			this.dropConstraint({ constraint: "user_email_key", schema: "public", table: "user" }),
			this.alterColumnType({
				column: "payload",
				schema: "public",
				table: "OutboxEvent",
				type: "jsonb",
				using: '"payload"::jsonb',
			}),
			this.alterColumnType({
				column: "themeColors",
				schema: "public",
				table: "Variant",
				type: "jsonb",
				using: '"themeColors"::jsonb',
			}),
			this.createIndex({
				columns: ["slug"],
				extras: { unique: true },
				index: "Variant_slug_key",
				schema: "public",
				table: "Variant",
			}),
			this.createIndex({
				columns: ["token"],
				extras: { unique: true },
				index: "session_token_key",
				schema: "public",
				table: "session",
			}),
			this.createIndex({
				columns: ["email"],
				extras: { unique: true },
				index: "user_email_key",
				schema: "public",
				table: "user",
			}),
		];
	}
}

MigrationCLI.run(import.meta.url, M);
