import { composeBuildMaps, instrumentationPlugin } from "@template/observability/plugin";

const result = await Bun.build({
	// Keep the runtime NODE_ENV lookup so telemetry resources do not inherit the build host environment.
	define: { "process.env.NODE_ENV": "process.env.NODE_ENV" },
	entrypoints: ["src/main.ts", "src/worker.ts"],
	outdir: "dist",
	packages: "external",
	plugins: [instrumentationPlugin(process.cwd())],
	sourcemap: "linked",
	target: "bun",
});
if (!result.success) {
	for (const log of result.logs) console.error(log);
	process.exit(1);
}

await composeBuildMaps(result.outputs);
