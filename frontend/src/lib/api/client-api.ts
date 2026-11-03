import {
	createClient,
	createOperationClient,
	type RequestConfig as KubbRequestConfig,
} from "@hyoretsu/kubb/client";
import ky, { type Options } from "ky";
import { branding } from "../branding";

const apiUrl = branding.apiUrl ?? import.meta.env.VITE_API_URL ?? "http://localhost:3333";

export type { ResponseConfig, ResponseErrorConfig } from "@hyoretsu/kubb/client";
export type RequestConfig<TVariables = unknown> = KubbRequestConfig<TVariables> & {
	timeout?: Options["timeout"];
};
export type Client = typeof legacyClient;

const transport = createClient(
	ky.extend({
		baseUrl: apiUrl,
		credentials: "include",
		retry: 0,
		timeout: false,
	}),
);

export default function legacyClient<TData, TError = unknown, TVariables = unknown>(
	config: RequestConfig<TVariables>,
	options?: Options,
) {
	return transport<TData, TError, TVariables>(config, {
		...options,
		retry: 0,
		signal: options?.signal ?? config.signal,
		// Explicit undefined resets Ky's instance default to its 10-second timeout.
		timeout: options?.timeout ?? config.timeout ?? false,
	});
}

export const client = createOperationClient(legacyClient);
export type { OperationOptions as Options, RequestResult } from "@hyoretsu/kubb/client";
