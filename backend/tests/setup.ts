if (!process.env.TEMPLATE_DISPOSABLE_TEST_RUN?.startsWith("template_test_"))
	throw new Error("Use the disposable integration/E2E runner.");
for (const key of ["DATABASE_URL", "REDIS_URL", "RABBITMQ_URL"] as const) {
	const host = new URL(process.env[key]!).hostname;
	if (!["127.0.0.1", "localhost", "[::1]"].includes(host)) throw new Error(`Non-local ${key}`);
}
