import { resolve } from "node:path";
import { RedisClient, SQL } from "bun";

const root = resolve(import.meta.dir, "..");
const [target = "backend", category = "integration"] = process.argv.slice(2);
if (!["backend", "sql"].includes(target) || !["integration", "e2e"].includes(category))
	throw new Error("Usage: test-runner.ts <backend|sql> <integration|e2e>");
const commands = new Set<ReturnType<typeof Bun.spawn>>();
async function command(args: string[], env: Record<string, string | undefined> = process.env, cwd = root) {
	const child = Bun.spawn(args, { cwd, env, stderr: "pipe", stdout: "pipe", timeout: 120000 });
	commands.add(child);
	const [out, err, code] = await Promise.all([
		new Response(child.stdout).text(),
		new Response(child.stderr).text(),
		child.exited,
	]);
	commands.delete(child);
	if (code) throw new Error(`${args[0]} failed: ${out}${err}`);
	return out.trim();
}
const namespace = `template_test_${crypto.randomUUID().replaceAll("-", "")}`;
const containers: string[] = [];
/** Existing servers (global or local .env) are used only through ephemeral/namespaced resources; otherwise start containers. */
const devUrl = (name: string) => process.env[name]?.trim() || undefined;
const postgresDevUrl = devUrl("POSTGRES_DEV_URL");
const redisDevUrl = devUrl("REDIS_DEV_URL");
const rabbitmqDevUrl = devUrl("RABBITMQ_DEV_URL");
if (!postgresDevUrl || !redisDevUrl || !rabbitmqDevUrl) {
	const context =
		process.env.DOCKER_HOST ||
		(await command(["docker", "context", "inspect", "--format", "{{.Endpoints.docker.Host}}"]));
	if (!context.startsWith("unix://")) throw new Error("Only local Unix Docker sockets are allowed.");
}
let externalRedis: RedisClient | undefined;
/** Best effort through the RabbitMQ management API: removes only this run's namespaced queues/exchanges. */
async function cleanupBroker(url: URL) {
	const base = process.env.RABBITMQ_DEV_MANAGEMENT_URL ?? `http://${url.hostname}:15672`;
	const headers = {
		authorization: `Basic ${btoa(`${decodeURIComponent(url.username)}:${decodeURIComponent(url.password)}`)}`,
	};
	const vhost = encodeURIComponent(decodeURIComponent(url.pathname.slice(1)) || "/");
	for (const kind of ["queues", "exchanges"]) {
		const response = await fetch(`${base}/api/${kind}/${vhost}`, { headers });
		if (!response.ok) return console.warn(`RabbitMQ cleanup skipped (${response.status}): ${namespace}*`);
		for (const { name } of (await response.json()) as { name: string }[])
			if (name.includes(namespace))
				await fetch(`${base}/api/${kind}/${vhost}/${encodeURIComponent(name)}`, {
					headers,
					method: "DELETE",
				});
	}
}
let externalAdmin: SQL | undefined;
let externalDatabase = "";
let testProcess: ReturnType<typeof Bun.spawn> | undefined;
let interrupted = false;
for (const signal of ["SIGINT", "SIGTERM"] as const)
	process.on(signal, () => {
		interrupted = true;
		testProcess?.kill(signal);
		for (const child of commands) child.kill(signal);
	});
async function service(name: string, image: string, port: number, variables: string[], ready: string[]) {
	if (interrupted) throw new Error("Interrupted");
	await command(["docker", "image", "inspect", image]);
	const container = `${namespace}_${name}`;
	containers.push(container);
	await command([
		"docker",
		"run",
		"--pull=never",
		"-d",
		"--name",
		container,
		"--label",
		`template.test-run=${namespace}`,
		"-p",
		`127.0.0.1::${port}`,
		...variables.flatMap(value => ["-e", value]),
		...(name === "rabbitmq" ? ["--entrypoint", "sh"] : []),
		image,
		...(name === "rabbitmq"
			? [
					"-ec",
					"printf disposable-local-cookie > /var/lib/rabbitmq/.erlang.cookie; chown rabbitmq:rabbitmq /var/lib/rabbitmq/.erlang.cookie; chmod 600 /var/lib/rabbitmq/.erlang.cookie; exec docker-entrypoint.sh rabbitmq-server",
				]
			: []),
	]);
	const binding = await command(["docker", "port", container, `${port}/tcp`]);
	if (!/^127\.0\.0\.1:\d+$/.test(binding)) throw new Error("Non-local test binding");
	const deadline = Date.now() + 60000;
	while (true) {
		try {
			await command(["docker", "exec", container, ...ready]);
			break;
		} catch (error) {
			if (interrupted || Date.now() > deadline) {
				console.error(
					await command(["docker", "logs", "--tail", "40", container]).catch(
						() => "No container logs",
					),
				);
				throw error;
			}
			await Bun.sleep(250);
		}
	}
	return binding;
}
try {
	let databaseUrl: string;
	if (postgresDevUrl) {
		const admin = new URL(postgresDevUrl);
		admin.pathname = "/postgres";
		externalAdmin = new SQL(admin.toString());
		externalDatabase = `${namespace}_db`;
		await externalAdmin.unsafe(`CREATE DATABASE "${externalDatabase}"`);
		const external = new URL(postgresDevUrl);
		external.pathname = `/${externalDatabase}`;
		databaseUrl = external.toString();
	} else {
		const pg = await service(
			"postgres",
			"postgres:16",
			5432,
			["POSTGRES_PASSWORD=template", "POSTGRES_DB=template"],
			["pg_isready", "-U", "postgres"],
		);
		databaseUrl = `postgresql://postgres:template@${pg}/template`;
	}
	let redisUrl: string;
	if (redisDevUrl) {
		externalRedis = new RedisClient(redisDevUrl);
		await externalRedis.send("PING", []);
		redisUrl = redisDevUrl;
	} else redisUrl = `redis://${await service("redis", "redis:7-alpine", 6379, [], ["redis-cli", "ping"])}`;
	const rabbitmqUrl =
		rabbitmqDevUrl ??
		`amqp://template:template@${await service(
			"rabbitmq",
			"rabbitmq:4-alpine",
			5672,
			[
				"RABBITMQ_DEFAULT_USER=template",
				"RABBITMQ_DEFAULT_PASS=template",
				"RABBITMQ_SERVER_ADDITIONAL_ERL_ARGS=+S 2:2",
				"RABBITMQ_CTL_ERL_ARGS=+S 1:1",
			],
			["rabbitmq-diagnostics", "-q", "ping"],
		)}`;
	const env: Record<string, string | undefined> = { ...process.env };
	for (const key of Object.keys(env))
		if (/(DATABASE|POSTGRES|REDIS|RABBITMQ|BROKER).*_(URL|SOCKET)$/.test(key)) delete env[key];
	Object.assign(env, {
		BETTER_AUTH_SECRETS: "1:local-disposable-test-secret-with-more-than-32-characters",
		BETTER_AUTH_URL: "http://localhost:3333",
		CORS_WHITELIST: "http://localhost:5173",
		DATABASE_URL: databaseUrl,
		NODE_ENV: "test",
		RABBITMQ_URL: rabbitmqUrl,
		REDIS_URL: redisUrl,
		SERVICE_NAMESPACE: namespace,
		TEMPLATE_DISPOSABLE_TEST_RUN: namespace,
	});
	await command(
		["bun", "x", "--no-install", "prisma", "migrate", "deploy"],
		env,
		resolve(root, "packages/sql"),
	);
	const directory = target === "backend" ? "backend/tests" : "packages/sql/tests";
	const paths = await Array.fromAsync(
		new Bun.Glob(`**/*.${category}.test.ts`).scan({ absolute: true, cwd: resolve(root, directory) }),
	);
	if (!paths.length) throw new Error("No tests selected");
	if (interrupted) throw new Error("Interrupted");
	testProcess = Bun.spawn(["bun", "test", ...paths, "--timeout", "60000"], {
		cwd: root,
		env,
		stderr: "inherit",
		stdout: "inherit",
	});
	const timeout = setTimeout(() => testProcess?.kill("SIGTERM"), 180000);
	const result = await testProcess.exited;
	clearTimeout(timeout);
	if (interrupted || result) process.exitCode = result || 1;
} finally {
	if (externalDatabase)
		await externalAdmin
			?.unsafe(`DROP DATABASE IF EXISTS "${externalDatabase}" WITH (FORCE)`)
			.catch(error => {
				console.error(error);
				process.exitCode = 1;
			});
	await externalAdmin?.close().catch(() => undefined);
	if (externalRedis) {
		const keys = (await externalRedis.send("KEYS", [`${namespace}*`]).catch(() => [])) as string[];
		if (keys.length) await externalRedis.send("DEL", keys).catch(error => console.error(error));
		externalRedis.close();
	}
	if (rabbitmqDevUrl) await cleanupBroker(new URL(rabbitmqDevUrl)).catch(error => console.error(error));
	for (const name of containers.reverse())
		try {
			await command(["docker", "rm", "-f", "-v", name]);
		} catch (error) {
			console.error(error);
			process.exitCode = 1;
		}
}
