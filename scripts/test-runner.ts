import { resolve } from "node:path";

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
const context =
	process.env.DOCKER_HOST ||
	(await command(["docker", "context", "inspect", "--format", "{{.Endpoints.docker.Host}}"]));
if (!context.startsWith("unix://")) throw new Error("Only local Unix Docker sockets are allowed.");
const namespace = `template_test_${crypto.randomUUID().replaceAll("-", "")}`;
const containers: string[] = [];
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
	const pg = await service(
		"postgres",
		"postgres:16",
		5432,
		["POSTGRES_PASSWORD=template", "POSTGRES_DB=template"],
		["pg_isready", "-U", "postgres"],
	);
	const redis = await service("redis", "redis:7-alpine", 6379, [], ["redis-cli", "ping"]);
	const rabbit = await service(
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
	);
	const env: Record<string, string | undefined> = { ...process.env };
	for (const key of Object.keys(env))
		if (/(DATABASE|REDIS|RABBITMQ|BROKER).*_(URL|SOCKET)$/.test(key)) delete env[key];
	Object.assign(env, {
		BETTER_AUTH_SECRETS: "1:local-disposable-test-secret-with-more-than-32-characters",
		BETTER_AUTH_URL: "http://localhost:3333",
		CORS_WHITELIST: "http://localhost:5173",
		DATABASE_URL: `postgresql://postgres:template@${pg}/template`,
		NODE_ENV: "test",
		RABBITMQ_URL: `amqp://template:template@${rabbit}`,
		REDIS_URL: `redis://${redis}`,
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
	for (const name of containers.reverse())
		try {
			await command(["docker", "rm", "-f", "-v", name]);
		} catch (error) {
			console.error(error);
			process.exitCode = 1;
		}
}
