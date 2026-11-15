import { operation, recordCacheResult } from "@template/observability";
import { RedisClient } from "bun";
import type { Cache } from "@/shared/types/events";
import { serviceKey } from "../service-namespace";

export class RedisCache implements Cache {
	readonly client: RedisClient;
	constructor(url = process.env.REDIS_URL) {
		const client = new RedisClient(url, { autoReconnect: true, connectionTimeout: 500 });
		// Redis spans sit at the physical command boundary; keys and values are never recorded.
		this.client = new Proxy(client, {
			get(target, key) {
				const value = Reflect.get(target, key, target);
				if (typeof value !== "function") return value;
				return (...args: unknown[]) =>
					operation(
						`redis.${typeof key === "string" && ["send", "get", "set", "del", "exists", "expire", "incr", "close", "connect"].includes(key) ? key : "command"}`,
						() => Reflect.apply(value, target, args),
						{ "db.system.name": "redis" },
					);
			},
		});
	}
	async read<T>(scope: string, key: string, load: () => Promise<T>): Promise<T> {
		const generationKey = serviceKey(`cache:${scope}:generation`);
		try {
			const generation = (await this.client.get(generationKey)) ?? "0";
			const entry = serviceKey(`cache:${scope}:${generation}:${key}`);
			const cached = await this.client.get(entry);
			if (cached !== null) {
				recordCacheResult("hit");
				return JSON.parse(cached) as T;
			}
			recordCacheResult("miss");
			const value = await load();
			// Generation check and write are atomic; an invalidation always wins.
			await this.client.send("EVAL", [
				"if (redis.call('GET',KEYS[1]) or '0')==ARGV[1] then return redis.call('SET',KEYS[2],ARGV[2],'EX',ARGV[3]) end; return nil",
				"2",
				generationKey,
				entry,
				generation,
				JSON.stringify(value),
				String(Number(process.env.CACHE_TTL_SECONDS ?? 60)),
			]);
			return value;
		} catch {
			return load();
		}
	}
	async invalidate(scope: string) {
		await this.client.send("INCR", [serviceKey(`cache:${scope}:generation`)]);
	}
	async close() {
		this.client.close();
	}
}
