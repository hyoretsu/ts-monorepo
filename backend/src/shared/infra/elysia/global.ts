import "@/env";
import { timeConversion } from "@hyoretsu/utils";
import { startDependency } from "@template/observability";
import { instrumentRequest, setHttpRoute } from "@template/observability/http";
import Elysia from "elysia";
import { ip } from "elysia-ip";
import type { ElysiaCookie } from "elysia/cookies";
import { Cookies } from "../../types";
import { mailer } from "../mail";
import { db } from "../sql";

const isDev = process.env.NODE_ENV === "development";

export const GlobalPlugin = new Elysia({
	name: "GlobalPlugin",
})
	.wrap(
		handler =>
			instrumentRequest(
				handler as unknown as (request: Request) => Response | Promise<Response>,
			) as never,
	)
	.onAfterHandle(({ route }) => setHttpRoute(route))
	.trace(
		({
			context: requestContext,
			onParse,
			onTransform,
			onBeforeHandle,
			onHandle,
			onMapResponse,
			onError,
			onAfterResponse,
		}) => {
			let finishValidation: ((failed?: boolean) => void) | undefined;
			const closeValidation = (failed = false) => {
				finishValidation?.(failed);
				finishValidation = undefined;
			};
			onParse(({ onStop }) => {
				setHttpRoute(requestContext.route);
				const finish = startDependency("http.parse");
				onStop(({ error }) => finish(Boolean(error)));
			});
			onTransform(({ onStop }) => {
				onStop(({ error }) => {
					if (!error) finishValidation = startDependency("http.validation");
				});
			});
			onBeforeHandle(({ onStop }) => {
				closeValidation();
				setHttpRoute(requestContext.route);
				const finish = startDependency("http.authentication");
				onStop(({ error }) => finish(Boolean(error)));
			});
			onHandle(({ onStop }) => {
				closeValidation();
				const finish = startDependency("http.handler");
				onStop(({ error }) => finish(Boolean(error)));
			});
			onMapResponse(({ onStop }) => {
				const finish = startDependency("http.serialization");
				onStop(({ error }) => finish(Boolean(error)));
			});
			onError(() => {
				closeValidation(true);
				setHttpRoute(requestContext.route);
			});
			onAfterResponse(() => closeValidation());
		},
	)
	.use(ip({ headersFirst: true }))
	.guard({
		cookie: Cookies,
	})
	.decorate({
		db,
		mailProvider: mailer,
	})
	.derive(() => ({
		setCookies: {} as Record<string, string | ElysiaCookie>,
	}))
	.onAfterHandle(({ cookie, responseValue, setCookies }) => {
		if (setCookies) {
			for (let [name, options] of Object.entries(setCookies)) {
				if (typeof options !== "object") {
					options = { value: options };
				}

				options.domain ??= process.env.BASE_DOMAIN || process.env.DOMAIN || "localhost";
				options.httpOnly ??= true;
				options.maxAge ??= timeConversion(400, "days", "seconds");
				options.path ??= "/";
				options.sameSite ??= isDev ? "lax" : "none";
				options.secure ??= !isDev;

				cookie[name]?.set(options);
			}
		}

		return responseValue ?? {};
	})
	.as("global");
