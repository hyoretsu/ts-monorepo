import { RedisClient } from "bun";
import type { Cache } from "@/shared/types/events";
import { serviceKey } from "../service-namespace";

export class RedisCache implements Cache {
	readonly client: RedisClient;
	constructor(url = process.env.REDIS_URL) {
		this.client = new RedisClient(url, { autoReconnect: true, connectionTimeout: 500 });
	}
	async read<T>(scope: string, key: string, load: () => Promise<T>): Promise<T> {
		const generationKey = serviceKey(`cache:${scope}:generation`);
		try {
			const generation = (await this.client.get(generationKey)) ?? "0";
			const entry = serviceKey(`cache:${scope}:${generation}:${key}`);
			const cached = await this.client.get(entry);
			if (cached !== null) return JSON.parse(cached) as T;
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
