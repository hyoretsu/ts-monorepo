import { initialize } from "@template/observability/sdk";
import { projectName } from "./shared/infra/service-namespace";

initialize("worker", projectName);
await import("./worker-app");
