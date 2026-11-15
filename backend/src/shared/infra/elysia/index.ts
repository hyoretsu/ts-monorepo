import cors from "@elysiajs/cors";
import staticPlugin from "@elysiajs/static";
import { timeConversion } from "@hyoretsu/utils";
import { clientGateway } from "@template/observability/gateway";
import Elysia from "elysia";
import { envSchema } from "@/env";
import { DomainError } from "@/shared/errors/DomainError";
import { auth } from "@/shared/infra/betterAuth";
import { projectName } from "../service-namespace";
import { TAURI_ORIGINS } from "../tauri-origins";
import { GlobalPlugin } from "./global";
import { OpenAPI } from "./openapi";
import { consume } from "./rateLimit";

const trustedOrigins = [...(process.env.CORS_WHITELIST?.split(",").filter(Boolean) ?? []), ...TAURI_ORIGINS];
// Web/Tauri export a restricted trace subset through this gateway; it stays 404 while telemetry is disabled.
const receiveTelemetry = clientGateway(projectName, trustedOrigins);

export const app = new Elysia({ normalize: "typebox" })
	.env(envSchema)
	.onError(({ error, set }) => {
		if (error instanceof DomainError) {
			set.status = error.status;

			return {
				...(error.description && { description: error.description }),
				error: error.message,
			};
		}
	})
	.use(cors({ credentials: true, origin: trustedOrigins }))
	.post(
		"/telemetry/traces",
		({ request, server }) => receiveTelemetry(request, server?.requestIP(request)?.address),
		{ detail: { hide: true }, parse: "none" },
	)
	.use([
		staticPlugin({
			assets: process.env.STATIC_DIR!,
			prefix: "/static",
		}),
		GlobalPlugin,
	])
	.all("/auth/*", ({ request, set }) => {
		const outcome = consume(request, {
			keyPrefix: "auth",
			max: 30,
			windowMs: timeConversion(1, "minutes", "milliseconds"),
		});

		if (!outcome.allowed) {
			set.status = 429;
			if (outcome.retryAfterSeconds) {
				set.headers["Retry-After"] = String(outcome.retryAfterSeconds);
			}
			return { error: "RATE_LIMITED" };
		}

		return auth.handler(request);
	})
	.use(OpenAPI)
	.get("/health", () => ({ status: "ok" }));
