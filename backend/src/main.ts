import { initialize, shutdown } from "@template/observability/sdk";
import { projectName } from "./shared/infra/service-namespace";

initialize("api", projectName);
process.on("SIGTERM", async () => {
	await shutdown();
	process.exit(0);
});
process.on("SIGINT", async () => {
	await shutdown();
	process.exit(0);
});
await import("./api");
