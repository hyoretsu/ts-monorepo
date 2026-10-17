export const serviceNamespace = () =>
	process.env.SERVICE_NAMESPACE?.trim() ||
	(process.env.NODE_ENV === "production" ? "template" : "template_dev");
export const serviceKey = (name: string) => `${serviceNamespace()}:${name}`;
export const serviceExchange = (name: string) => `${serviceNamespace()}.${name}`;
