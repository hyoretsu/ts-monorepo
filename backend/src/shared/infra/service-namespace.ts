/** Stable project identifier: prefixes namespaces and telemetry service names (`<project>-api`, `<project>-worker`, ...). */
export const projectName = "template";
export const serviceNamespace = () =>
	process.env.SERVICE_NAMESPACE?.trim() ||
	(process.env.NODE_ENV === "production" ? projectName : `${projectName}_dev`);
export const serviceKey = (name: string) => `${serviceNamespace()}:${name}`;
export const serviceExchange = (name: string) => `${serviceNamespace()}.${name}`;
