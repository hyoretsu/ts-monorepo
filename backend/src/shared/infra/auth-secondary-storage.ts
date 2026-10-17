import { createHmac } from "node:crypto";
import { RedisClient } from "bun";
import { serviceKey } from "./service-namespace";
/** PostgreSQL remains authoritative for sessions; Redis is a disposable mirror. */
export class AuthSecondaryStorage {
	readonly client = new RedisClient(process.env.REDIS_URL, { autoReconnect: true, connectionTimeout: 500 });
	private key(key: string) {
		return serviceKey(
			`auth:${createHmac(
				"sha256",
				process.env.BETTER_AUTH_SECRET || process.env.BETTER_AUTH_SECRETS || "local-only",
			)
				.update(key)
				.digest("hex")}`,
		);
	}
	async get(key: string) {
		try {
			const value = await this.client.get(this.key(key));
			if (value) {
				const parsed = JSON.parse(value);
				if (parsed && typeof parsed === "object" && "session" in parsed) return null;
			}
			return value;
		} catch {
			return null;
		}
	}
	async set(key: string, value: string, ttl = 60) {
		try {
			await this.client.send("SET", [this.key(key), value, "EX", String(Math.max(1, Math.ceil(ttl)))]);
		} catch {
			/* Database is authoritative. */
		}
	}
	async delete(key: string) {
		try {
			await this.client.del(this.key(key));
		} catch {
			/* Never authorize from this mirror. */
		}
	}
}
