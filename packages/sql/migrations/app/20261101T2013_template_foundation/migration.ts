#!/usr/bin/env -S node
import { col, fn, lit, Migration, MigrationCLI, primaryKey, sql } from "@prisma/orm-postgres/migration";
import type { Contract as End } from "../../snapshots/e5373342848d151f564158ec07a7db3fc1f3d5b82fd5eb764b31518bce48c2a3/contract";
import endContract from "../../snapshots/e5373342848d151f564158ec07a7db3fc1f3d5b82fd5eb764b31518bce48c2a3/contract.json" with { type: "json" };

export default class M extends Migration<never, End> {
	override readonly endContractJson = endContract;

	override get operations() {
		return [
			this.createSchema({ schema: "public" }),
			this.createTable({
				columns: [
					col("createdAt", "timestamp(3)", {
						codecRef: { codecId: "pg/timestamp-date@1", typeParams: { precision: 3 } },
						default: fn(sql`now()`),
						notNull: true,
					}),
					col("id", "text", { codecRef: { codecId: "pg/text@1" }, notNull: true }),
					col("name", "text", { codecRef: { codecId: "pg/text@1" }, notNull: true }),
					col("processedAt", "timestamp(3)", {
						codecRef: { codecId: "pg/timestamp-date@1", typeParams: { precision: 3 } },
					}),
					col("userId", "text", { codecRef: { codecId: "pg/text@1" }, notNull: true }),
				],
				constraints: [primaryKey(["id"])],
				schema: "public",
				table: "Example",
			}),
			this.createTable({
				columns: [
					col("aggregateId", "text", { codecRef: { codecId: "pg/text@1" }, notNull: true }),
					col("availableAt", "timestamp(3)", {
						codecRef: { codecId: "pg/timestamp-date@1", typeParams: { precision: 3 } },
						default: fn(sql`now()`),
						notNull: true,
					}),
					col("createdAt", "timestamp(3)", {
						codecRef: { codecId: "pg/timestamp-date@1", typeParams: { precision: 3 } },
						default: fn(sql`now()`),
						notNull: true,
					}),
					col("id", "text", { codecRef: { codecId: "pg/text@1" }, notNull: true }),
					col("leaseToken", "text", { codecRef: { codecId: "pg/text@1" } }),
					col("leaseUntil", "timestamp(3)", {
						codecRef: { codecId: "pg/timestamp-date@1", typeParams: { precision: 3 } },
					}),
					col("payload", "json", { codecRef: { codecId: "pg/json@1" }, notNull: true }),
					col("publishedAt", "timestamp(3)", {
						codecRef: { codecId: "pg/timestamp-date@1", typeParams: { precision: 3 } },
					}),
					col("type", "text", { codecRef: { codecId: "pg/text@1" }, notNull: true }),
					col("userId", "text", { codecRef: { codecId: "pg/text@1" }, notNull: true }),
				],
				constraints: [primaryKey(["id"])],
				schema: "public",
				table: "OutboxEvent",
			}),
			this.createTable({
				columns: [
					col("consumer", "text", { codecRef: { codecId: "pg/text@1" }, notNull: true }),
					col("eventId", "text", { codecRef: { codecId: "pg/text@1" }, notNull: true }),
					col("processedAt", "timestamp(3)", {
						codecRef: { codecId: "pg/timestamp-date@1", typeParams: { precision: 3 } },
						default: fn(sql`now()`),
						notNull: true,
					}),
				],
				constraints: [primaryKey(["consumer", "eventId"])],
				schema: "public",
				table: "ProcessedMessage",
			}),
			this.createTable({
				columns: [
					col("allowThemeToggle", "bool", { codecRef: { codecId: "pg/bool@1" } }),
					col("apiUrl", "text", { codecRef: { codecId: "pg/text@1" } }),
					col("createdAt", "timestamp(3)", {
						codecRef: { codecId: "pg/timestamp-date@1", typeParams: { precision: 3 } },
						default: fn(sql`now()`),
						notNull: true,
					}),
					col("defaultTheme", "text", { codecRef: { codecId: "pg/text@1" } }),
					col("fontFamily", "text", { codecRef: { codecId: "pg/text@1" } }),
					col("fontUrl", "text", { codecRef: { codecId: "pg/text@1" } }),
					col("footerText", "text", { codecRef: { codecId: "pg/text@1" } }),
					col("id", "text", { codecRef: { codecId: "pg/text@1" }, notNull: true }),
					col("logoUrl", "text", { codecRef: { codecId: "pg/text@1" } }),
					col("mobileIconUrl", "text", { codecRef: { codecId: "pg/text@1" } }),
					col("name", "text", { codecRef: { codecId: "pg/text@1" }, notNull: true }),
					col("nativePackageId", "text", { codecRef: { codecId: "pg/text@1" } }),
					col("siteUrl", "text", { codecRef: { codecId: "pg/text@1" } }),
					col("slug", "text", { codecRef: { codecId: "pg/text@1" }, notNull: true }),
					col("themeColors", "json", { codecRef: { codecId: "pg/json@1" } }),
					col("updatedAt", "timestamp(3)", {
						codecRef: { codecId: "pg/timestamp-date@1", typeParams: { precision: 3 } },
						notNull: true,
					}),
				],
				constraints: [primaryKey(["id"])],
				schema: "public",
				table: "Variant",
			}),
			this.createTable({
				columns: [
					col("accessToken", "text", { codecRef: { codecId: "pg/text@1" } }),
					col("accessTokenExpiresAt", "timestamp(3)", {
						codecRef: { codecId: "pg/timestamp-date@1", typeParams: { precision: 3 } },
					}),
					col("accountId", "text", { codecRef: { codecId: "pg/text@1" }, notNull: true }),
					col("createdAt", "timestamp(3)", {
						codecRef: { codecId: "pg/timestamp-date@1", typeParams: { precision: 3 } },
						default: fn(sql`now()`),
						notNull: true,
					}),
					col("id", "text", { codecRef: { codecId: "pg/text@1" }, notNull: true }),
					col("idToken", "text", { codecRef: { codecId: "pg/text@1" } }),
					col("password", "text", { codecRef: { codecId: "pg/text@1" } }),
					col("providerId", "text", { codecRef: { codecId: "pg/text@1" }, notNull: true }),
					col("refreshToken", "text", { codecRef: { codecId: "pg/text@1" } }),
					col("refreshTokenExpiresAt", "timestamp(3)", {
						codecRef: { codecId: "pg/timestamp-date@1", typeParams: { precision: 3 } },
					}),
					col("scope", "text", { codecRef: { codecId: "pg/text@1" } }),
					col("updatedAt", "timestamp(3)", {
						codecRef: { codecId: "pg/timestamp-date@1", typeParams: { precision: 3 } },
						notNull: true,
					}),
					col("userId", "text", { codecRef: { codecId: "pg/text@1" }, notNull: true }),
				],
				constraints: [primaryKey(["id"])],
				schema: "public",
				table: "account",
			}),
			this.createTable({
				columns: [
					col("createdAt", "timestamp(3)", {
						codecRef: { codecId: "pg/timestamp-date@1", typeParams: { precision: 3 } },
						default: fn(sql`now()`),
						notNull: true,
					}),
					col("expiresAt", "timestamp(3)", {
						codecRef: { codecId: "pg/timestamp-date@1", typeParams: { precision: 3 } },
						notNull: true,
					}),
					col("id", "text", { codecRef: { codecId: "pg/text@1" }, notNull: true }),
					col("ipAddress", "text", { codecRef: { codecId: "pg/text@1" } }),
					col("token", "text", { codecRef: { codecId: "pg/text@1" }, notNull: true }),
					col("updatedAt", "timestamp(3)", {
						codecRef: { codecId: "pg/timestamp-date@1", typeParams: { precision: 3 } },
						notNull: true,
					}),
					col("userAgent", "text", { codecRef: { codecId: "pg/text@1" } }),
					col("userId", "text", { codecRef: { codecId: "pg/text@1" }, notNull: true }),
				],
				constraints: [primaryKey(["id"])],
				schema: "public",
				table: "session",
			}),
			this.createTable({
				columns: [
					col("createdAt", "timestamp(3)", {
						codecRef: { codecId: "pg/timestamp-date@1", typeParams: { precision: 3 } },
						default: fn(sql`now()`),
						notNull: true,
					}),
					col("email", "text", { codecRef: { codecId: "pg/text@1" }, notNull: true }),
					col("emailVerified", "bool", {
						codecRef: { codecId: "pg/bool@1" },
						default: lit(false),
						notNull: true,
					}),
					col("id", "text", { codecRef: { codecId: "pg/text@1" }, notNull: true }),
					col("image", "text", { codecRef: { codecId: "pg/text@1" } }),
					col("name", "text", { codecRef: { codecId: "pg/text@1" }, notNull: true }),
					col("role", "text", {
						codecRef: { codecId: "pg/text@1" },
						default: lit("user"),
						notNull: true,
					}),
					col("updatedAt", "timestamp(3)", {
						codecRef: { codecId: "pg/timestamp-date@1", typeParams: { precision: 3 } },
						notNull: true,
					}),
				],
				constraints: [primaryKey(["id"])],
				schema: "public",
				table: "user",
			}),
			this.createTable({
				columns: [
					col("createdAt", "timestamp(3)", {
						codecRef: { codecId: "pg/timestamp-date@1", typeParams: { precision: 3 } },
						default: fn(sql`now()`),
						notNull: true,
					}),
					col("expiresAt", "timestamp(3)", {
						codecRef: { codecId: "pg/timestamp-date@1", typeParams: { precision: 3 } },
						notNull: true,
					}),
					col("id", "text", { codecRef: { codecId: "pg/text@1" }, notNull: true }),
					col("identifier", "text", { codecRef: { codecId: "pg/text@1" }, notNull: true }),
					col("updatedAt", "timestamp(3)", {
						codecRef: { codecId: "pg/timestamp-date@1", typeParams: { precision: 3 } },
						notNull: true,
					}),
					col("value", "text", { codecRef: { codecId: "pg/text@1" }, notNull: true }),
				],
				constraints: [primaryKey(["id"])],
				schema: "public",
				table: "verification",
			}),
			this.addUnique({
				columns: ["slug"],
				constraint: "Variant_slug_key",
				schema: "public",
				table: "Variant",
			}),
			this.addUnique({
				columns: ["token"],
				constraint: "session_token_key",
				schema: "public",
				table: "session",
			}),
			this.addUnique({
				columns: ["email"],
				constraint: "user_email_key",
				schema: "public",
				table: "user",
			}),
			this.createIndex({
				columns: ["userId", "createdAt", "id"],
				index: "Example_userId_createdAt_id_idx_786b3fe4",
				schema: "public",
				table: "Example",
			}),
			this.createIndex({
				columns: ["publishedAt", "availableAt", "leaseUntil"],
				index: "OutboxEvent_publishedAt_availableAt_leaseUntil_idx_04a24fcf",
				schema: "public",
				table: "OutboxEvent",
			}),
			this.createIndex({
				columns: ["userId"],
				index: "account_userId_idx_a489d58a",
				schema: "public",
				table: "account",
			}),
			this.createIndex({
				columns: ["userId"],
				index: "session_userId_idx_a489d58a",
				schema: "public",
				table: "session",
			}),
			this.createIndex({
				columns: ["identifier"],
				index: "verification_identifier_idx_79a0dbb3",
				schema: "public",
				table: "verification",
			}),
			this.addForeignKey({
				foreignKey: {
					columns: ["userId"],
					name: "account_userId_fkey",
					onDelete: "cascade",
					onUpdate: "cascade",
					references: { columns: ["id"], schema: "public", table: "user" },
				},
				schema: "public",
				table: "account",
			}),
			this.addForeignKey({
				foreignKey: {
					columns: ["userId"],
					name: "session_userId_fkey",
					onDelete: "cascade",
					onUpdate: "cascade",
					references: { columns: ["id"], schema: "public", table: "user" },
				},
				schema: "public",
				table: "session",
			}),
		];
	}
}

MigrationCLI.run(import.meta.url, M);
