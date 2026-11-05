// Any HTTP response proves the server is listening; only transport failures count.
const timeoutMs = 5000;
const targets = {
	api: `http://127.0.0.1:${process.env.PORT || 3333}/`,
	frontend: `http://127.0.0.1:${process.env.FRONTEND_PORT || 5173}/`,
};

const results: Record<string, string> = {};
await Promise.all(
	Object.entries(targets).map(async ([name, url]) => {
		try {
			const response = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(timeoutMs) });
			await response.body?.cancel();
			results[name] = "ok";
		} catch {
			results[name] = "failed";
		}
	}),
);

console.log(JSON.stringify(results));
process.exit(Object.values(results).every(status => status === "ok") ? 0 : 1);
